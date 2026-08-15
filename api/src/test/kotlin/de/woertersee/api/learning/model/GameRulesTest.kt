package de.woertersee.api.learning.model

import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class GameRulesTest {
    @Test fun `early finish scores answered cards only`() {
        assertEquals(50.0, GameRules.accuracy(1, 1))
        assertNull(GameRules.accuracy(0, 0))
    }

    @Test fun `review contains difficult cards once`() {
        val difficult = UUID.randomUUID()
        val known = UUID.randomUUID()
        assertEquals(listOf(difficult), GameRules.reviewWordIds(listOf(difficult to AnswerResult.DIFFICULT, known to AnswerResult.KNOWN, difficult to AnswerResult.DIFFICULT)))
    }
}
