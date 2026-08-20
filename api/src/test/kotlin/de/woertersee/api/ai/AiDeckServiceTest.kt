package de.woertersee.api.ai

import de.woertersee.api.personalwords.PersonalWordService
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import kotlin.test.assertEquals

class AiDeckServiceTest {
    private val words = mock(PersonalWordService::class.java)

    @Test
    fun `generated cards are trimmed and retained for review`() {
        val generator = AiDeckGenerator {
            AiDeckPreview(
                " Travel ", "Travel",
                listOf(AiDeckCard(" der Bahnhof ", " station ", "A train station", null, null)),
            )
        }
        val result = AiDeckService(generator, words).generate(GenerateAiDeckRequest("travel", cardCount = 1))

        assertEquals("der Bahnhof", result.cards.single().german)
        assertEquals("station", result.cards.single().english)
    }

    @Test
    fun `incomplete irregular forms are rejected`() {
        val generator = AiDeckGenerator {
            AiDeckPreview("Travel", "Travel", listOf(AiDeckCard("fahren", "to travel", preterite = "fuhr")))
        }

        assertThrows<IllegalArgumentException> {
            AiDeckService(generator, words).generate(GenerateAiDeckRequest("travel", cardCount = 1))
        }
    }

    @Test
    fun `duplicate generated cards are rejected`() {
        val card = AiDeckCard("der Bahnhof", "station")
        val generator = AiDeckGenerator { AiDeckPreview("Travel", "Travel", listOf(card, card)) }

        assertThrows<IllegalArgumentException> {
            AiDeckService(generator, words).generate(GenerateAiDeckRequest("travel", cardCount = 2))
        }
    }
}
