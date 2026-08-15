package de.woertersee.api.progress

import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals

class ProgressStreakTest {
    private val today = LocalDate.of(2026, 8, 15)

    @Test
    fun `counts consecutive practice days including today`() {
        val dates = listOf(today, today.minusDays(1), today.minusDays(2), today.minusDays(4))
        assertEquals(3, ProgressStreak.calculate(dates, today))
    }

    @Test
    fun `keeps a streak alive until the end of the next day`() {
        val dates = listOf(today.minusDays(1), today.minusDays(2))
        assertEquals(2, ProgressStreak.calculate(dates, today))
    }

    @Test
    fun `returns zero for an expired streak`() {
        assertEquals(0, ProgressStreak.calculate(listOf(today.minusDays(2)), today))
    }
}
