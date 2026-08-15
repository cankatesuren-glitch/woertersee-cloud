package de.woertersee.api.progress

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

@Service
class ProgressDashboardService(private val jdbc: JdbcClient) {
    fun get(profileId: UUID): ProgressDashboard {
        val totals = jdbc.sql(
            """SELECT count(*) AS explored,
                      count(*) FILTER (WHERE state = 'KNOWN') AS known,
                      count(*) FILTER (WHERE state = 'DIFFICULT') AS difficult,
                      coalesce(sum(total_attempts), 0) AS attempts,
                      coalesce(sum(known_attempts), 0) AS known_attempts,
                      max(last_played_at) AS last_played_at
               FROM (
                 SELECT state,total_attempts,known_attempts,last_played_at FROM user_progress WHERE profile_id=:profileId
                 UNION ALL
                 SELECT state,total_attempts,known_attempts,last_played_at FROM personal_word_progress WHERE profile_id=:profileId
               ) progress""",
        ).param("profileId", profileId).query { result, _ ->
            Totals(
                explored = result.getInt("explored"),
                known = result.getInt("known"),
                difficult = result.getInt("difficult"),
                attempts = result.getInt("attempts"),
                knownAttempts = result.getInt("known_attempts"),
                lastPractisedAt = result.getTimestamp("last_played_at")?.toInstant(),
            )
        }.single()

        val completedGames = jdbc.sql(
            "SELECT count(*) FROM game_sessions WHERE profile_id=:profileId AND status='COMPLETED'",
        ).param("profileId", profileId).query(Int::class.java).single()
        val practiceDates = jdbc.sql(
            """SELECT DISTINCT (answered_at AT TIME ZONE 'UTC')::date AS practice_date
               FROM answer_attempts WHERE profile_id=:profileId ORDER BY practice_date DESC""",
        ).param("profileId", profileId).query(LocalDate::class.java).list().filterNotNull()

        val accuracy = totals.attempts.takeIf { it > 0 }?.let { totals.knownAttempts * 100.0 / it }
        val summary = ProgressSummary(
            totals.explored,
            totals.known,
            totals.difficult,
            accuracy,
            completedGames,
            ProgressStreak.calculate(practiceDates, LocalDate.now(ZoneOffset.UTC)),
            totals.lastPractisedAt,
        )
        return ProgressDashboard(summary, activeGame(profileId), recentGames(profileId), difficultWords(profileId))
    }

    private fun activeGame(profileId: UUID): ActiveGameSummary? = jdbc.sql(
        """SELECT s.id,s.started_at,count(c.id) AS total_cards,
                  count(c.id) FILTER (WHERE c.result IS NOT NULL) AS answered_cards
           FROM game_sessions s JOIN game_session_cards c ON c.game_session_id=s.id
           WHERE s.profile_id=:profileId AND s.status='ACTIVE'
           GROUP BY s.id,s.started_at,s.updated_at ORDER BY s.updated_at DESC LIMIT 1""",
    ).param("profileId", profileId).query { result, _ ->
        ActiveGameSummary(
            result.getObject("id", UUID::class.java),
            result.getTimestamp("started_at").toInstant(),
            result.getInt("answered_cards"),
            result.getInt("total_cards"),
        )
    }.optional().orElse(null)

    private fun recentGames(profileId: UUID): List<RecentGameSummary> = jdbc.sql(
        """SELECT s.id,s.session_type,s.completed_at,count(c.id) AS total_cards,
                  count(c.id) FILTER (WHERE c.result='KNOWN') AS known_cards,
                  count(c.id) FILTER (WHERE c.result IS NOT NULL) AS answered_cards
           FROM game_sessions s JOIN game_session_cards c ON c.game_session_id=s.id
           WHERE s.profile_id=:profileId AND s.status='COMPLETED'
           GROUP BY s.id,s.session_type,s.completed_at ORDER BY s.completed_at DESC LIMIT 5""",
    ).param("profileId", profileId).query { result, _ ->
        val answered = result.getInt("answered_cards")
        RecentGameSummary(
            result.getObject("id", UUID::class.java),
            result.getString("session_type"),
            result.getTimestamp("completed_at").toInstant(),
            result.getInt("total_cards"),
            answered.takeIf { it > 0 }?.let { result.getInt("known_cards") * 100.0 / it },
        )
    }.list()

    private fun difficultWords(profileId: UUID): List<DifficultWordSummary> = jdbc.sql(
        """SELECT id,source,german,english FROM (
             SELECT w.id,'GLOBAL' AS source,w.german,w.english,up.last_played_at
             FROM user_progress up JOIN words w ON w.id=up.word_id
             WHERE up.profile_id=:profileId AND up.state='DIFFICULT' AND w.deleted_at IS NULL
             UNION ALL
             SELECT pw.id,'PERSONAL' AS source,pw.german,pw.english,pwp.last_played_at
             FROM personal_word_progress pwp JOIN personal_words pw ON pw.id=pwp.personal_word_id
             WHERE pwp.profile_id=:profileId AND pwp.state='DIFFICULT' AND pw.deleted_at IS NULL
           ) difficult ORDER BY last_played_at DESC LIMIT 10""",
    ).param("profileId", profileId).query { result, _ ->
        DifficultWordSummary(
            result.getObject("id", UUID::class.java),
            result.getString("source"),
            result.getString("german"),
            result.getString("english"),
        )
    }.list()

    private data class Totals(
        val explored: Int,
        val known: Int,
        val difficult: Int,
        val attempts: Int,
        val knownAttempts: Int,
        val lastPractisedAt: java.time.Instant?,
    )
}
