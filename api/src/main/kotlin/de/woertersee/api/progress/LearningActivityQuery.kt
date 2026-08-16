package de.woertersee.api.progress

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

@Service
class LearningActivityQuery(private val jdbc: JdbcClient) {
    fun get(
        profileId: UUID,
        periodDays: Int = 30,
        today: LocalDate = LocalDate.now(ZoneOffset.UTC),
    ): LearningActivity {
        require(periodDays in 1..90) { "Activity period must contain 1-90 days" }
        val fromDate = today.minusDays(periodDays.toLong() - 1)
        val days = jdbc.sql(
            """SELECT CAST(calendar.day AS date) AS activity_date,
                      coalesce(activity.games_started,0) AS games_started,
                      coalesce(activity.games_completed,0) AS games_completed
               FROM generate_series(
                 CAST(:fromDate AS date),CAST(:today AS date),interval '1 day'
               ) AS calendar(day)
               LEFT JOIN learning_activity_daily activity
                 ON activity.profile_id=:profileId
                AND activity.activity_date=CAST(calendar.day AS date)
               ORDER BY calendar.day""",
        ).param("fromDate", fromDate)
            .param("today", today)
            .param("profileId", profileId)
            .query { result, _ ->
                LearningActivityDay(
                    result.getObject("activity_date", LocalDate::class.java),
                    result.getInt("games_started"),
                    result.getInt("games_completed"),
                )
            }.list()

        return LearningActivity(
            periodDays,
            days.sumOf { it.gamesStarted },
            days.sumOf { it.gamesCompleted },
            days,
        )
    }
}
