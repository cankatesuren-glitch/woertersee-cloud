package de.woertersee.api.learning

import de.woertersee.api.learning.model.AnswerResult
import java.time.Duration
import java.time.Instant
import kotlin.test.Test
import kotlin.test.assertEquals

class ReviewSchedulerTest {
    private val answeredAt = Instant.parse("2026-08-16T12:00:00Z")

    @Test
    fun `difficult answer resets streak and returns after ten minutes`() {
        val plan = ReviewScheduler.schedule(AnswerResult.DIFFICULT, 4, answeredAt)

        assertEquals(0, plan.consecutiveKnown)
        assertEquals(Duration.ofMinutes(10), plan.interval)
        assertEquals(answeredAt.plusSeconds(600), plan.nextReviewAt)
    }

    @Test
    fun `known answers grow from one to three and seven days`() {
        assertEquals(Duration.ofDays(1), ReviewScheduler.schedule(AnswerResult.KNOWN, 0, answeredAt).interval)
        assertEquals(Duration.ofDays(3), ReviewScheduler.schedule(AnswerResult.KNOWN, 1, answeredAt).interval)
        assertEquals(Duration.ofDays(7), ReviewScheduler.schedule(AnswerResult.KNOWN, 2, answeredAt).interval)
    }

    @Test
    fun `known interval is capped at sixty days`() {
        val plan = ReviewScheduler.schedule(AnswerResult.KNOWN, 20, answeredAt)

        assertEquals(21, plan.consecutiveKnown)
        assertEquals(Duration.ofDays(60), plan.interval)
    }
}
