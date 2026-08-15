package de.woertersee.api.learning

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DeckBalancerTest {
    @Test
    fun `selects unique cards across categories as evenly as possible`() {
        val result = DeckBalancer.select(mapOf("verbs" to listOf(1, 2, 3), "nouns" to listOf(4, 5, 6)), 5)
        assertEquals(5, result.size)
        assertEquals(5, result.toSet().size)
        assertTrue(result.count { it <= 3 } in 2..3)
    }
}

