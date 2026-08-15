package de.woertersee.api.progress

import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class ProgressSummary(
    val exploredWords: Int,
    val knownWords: Int,
    val difficultWords: Int,
    val accuracy: Double?,
    val completedGames: Int,
    val currentStreakDays: Int,
    val lastPractisedAt: Instant?,
)

data class ActiveGameSummary(val id: UUID, val startedAt: Instant, val answeredCards: Int, val totalCards: Int)
data class RecentGameSummary(val id: UUID, val type: String, val completedAt: Instant, val totalCards: Int, val accuracy: Double?)
data class DifficultWordSummary(val id: UUID, val source: String, val german: String, val english: String)

data class ProgressDashboard(
    val summary: ProgressSummary,
    val activeGame: ActiveGameSummary?,
    val recentGames: List<RecentGameSummary>,
    val difficultWords: List<DifficultWordSummary>,
)

object ProgressStreak {
    fun calculate(practiceDates: List<LocalDate>, today: LocalDate): Int {
        val dates = practiceDates.distinct().sortedDescending()
        if (dates.isEmpty() || dates.first().isBefore(today.minusDays(1))) return 0
        var expected = dates.first()
        var streak = 0
        for (date in dates) {
            if (date != expected) break
            streak++
            expected = expected.minusDays(1)
        }
        return streak
    }
}
