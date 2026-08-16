package de.woertersee.api.learning

import de.woertersee.api.learning.model.AnswerResult
import java.time.Duration
import java.time.Instant

data class ReviewPlan(
    val consecutiveKnown: Int,
    val interval: Duration,
    val nextReviewAt: Instant,
)

object ReviewScheduler {
    private val knownIntervals = listOf(
        Duration.ofDays(1),
        Duration.ofDays(3),
        Duration.ofDays(7),
        Duration.ofDays(14),
        Duration.ofDays(30),
        Duration.ofDays(60),
    )

    fun schedule(result: AnswerResult, previousConsecutiveKnown: Int, answeredAt: Instant): ReviewPlan {
        val streak = if (result == AnswerResult.KNOWN) previousConsecutiveKnown + 1 else 0
        val interval = if (result == AnswerResult.DIFFICULT) {
            Duration.ofMinutes(10)
        } else {
            knownIntervals[(streak - 1).coerceAtMost(knownIntervals.lastIndex)]
        }
        return ReviewPlan(streak, interval, answeredAt.plus(interval))
    }
}
