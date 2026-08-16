package de.woertersee.api.identity

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.slf4j.MDC
import java.sql.Time
import java.time.ZoneId
import java.util.UUID

@Service
class CurrentProfileService(private val jdbc: JdbcClient) {
    fun resolve(jwt: Jwt): UUID {
        val issuer = jwt.issuer?.toString() ?: "unknown"
        return jdbc.sql(
            """INSERT INTO profiles (id, issuer, subject, display_name)
               VALUES (:id, :issuer, :subject, :name)
               ON CONFLICT (issuer, subject) DO UPDATE SET
                 display_name = COALESCE(EXCLUDED.display_name, profiles.display_name), updated_at = now()
               RETURNING id"""
        ).param("id", UUID.randomUUID())
            .param("issuer", issuer)
            .param("subject", jwt.subject)
            .param("name", jwt.getClaimAsString("name"))
            .query(UUID::class.java).single()
    }

    fun find(profileId: UUID): CurrentProfile = jdbc.sql(
        "SELECT id, display_name, daily_goal_games FROM profiles WHERE id = :id",
    ).param("id", profileId).query { result, _ ->
        CurrentProfile(
            id = result.getObject("id", UUID::class.java),
            displayName = result.getString("display_name"),
            dailyGoalGames = result.getInt("daily_goal_games"),
        )
    }.single()

    fun updateDailyGoal(profileId: UUID, games: Int): DailyGoalPreference {
        require(games in 1..10) { "Daily goal must contain 1-10 games" }
        return jdbc.sql(
            """UPDATE profiles SET daily_goal_games=:games,updated_at=now()
               WHERE id=:profileId RETURNING daily_goal_games""",
        ).param("games", games)
            .param("profileId", profileId)
            .query(Int::class.java)
            .single()
            .let(::DailyGoalPreference)
    }

    fun practiceReminder(profileId: UUID): PracticeReminderPreference = jdbc.sql(
        """SELECT practice_reminder_enabled,practice_reminder_time,practice_reminder_timezone
           FROM profiles WHERE id=:profileId""",
    ).param("profileId", profileId).query { result, _ ->
        PracticeReminderPreference(
            enabled = result.getBoolean("practice_reminder_enabled"),
            localTime = result.getTime("practice_reminder_time").toLocalTime(),
            timezone = result.getString("practice_reminder_timezone"),
        )
    }.single()

    @Transactional
    fun updatePracticeReminder(
        profileId: UUID,
        request: PracticeReminderRequest,
    ): PracticeReminderPreference {
        ZoneId.of(request.timezone)
        val preference = jdbc.sql(
            """UPDATE profiles SET practice_reminder_enabled=:enabled,
                 practice_reminder_time=:localTime,practice_reminder_timezone=:timezone,updated_at=now()
               WHERE id=:profileId
               RETURNING practice_reminder_enabled,practice_reminder_time,practice_reminder_timezone""",
        ).param("enabled", request.enabled)
            .param("localTime", Time.valueOf(request.localTime))
            .param("timezone", request.timezone)
            .param("profileId", profileId)
            .query { result, _ ->
                PracticeReminderPreference(
                    enabled = result.getBoolean("practice_reminder_enabled"),
                    localTime = result.getTime("practice_reminder_time").toLocalTime(),
                    timezone = result.getString("practice_reminder_timezone"),
                )
            }.single()

        val correlation = runCatching { UUID.fromString(MDC.get("correlation_id")) }
            .getOrElse { UUID.randomUUID() }
        jdbc.sql(
            """INSERT INTO outbox_events(event_id,event_type,event_version,aggregate_id,user_id,
                 occurred_at,correlation_id,payload)
               VALUES(:eventId,'PracticeReminderPreferenceChanged',1,:profileId,:profileId,now(),
                 :correlation,jsonb_build_object('profile_id',:profileId,'enabled',:enabled,
                 'local_time',:localTime,'timezone',:timezone))""",
        ).param("eventId", UUID.randomUUID())
            .param("profileId", profileId)
            .param("correlation", correlation)
            .param("enabled", preference.enabled)
            .param("localTime", preference.localTime.toString())
            .param("timezone", preference.timezone)
            .update()
        return preference
    }
}
