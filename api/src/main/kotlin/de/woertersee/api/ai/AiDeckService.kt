package de.woertersee.api.ai

import de.woertersee.api.personalwords.PersonalWordRequest
import de.woertersee.api.personalwords.PersonalWordService
import de.woertersee.api.platform.error.ConflictException
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class AiDeckService(private val generator: AiDeckGenerator, private val personalWords: PersonalWordService) {
    fun generate(request: GenerateAiDeckRequest): AiDeckPreview {
        val preview = generator.generate(request)
        val cards = preview.cards.map(::clean).distinctBy { it.german.lowercase() }
        require(cards.isNotEmpty()) { "AI response did not contain any valid cards" }
        return preview.copy(title = preview.title.ifBlank { request.topic.trim() }, cards = cards.take(request.cardCount))
    }

    fun import(owner: UUID, request: ImportAiDeckRequest): AiDeckImportResult {
        var added = 0
        var skipped = 0
        request.cards.map(::clean).forEach { card ->
            val forms = listOfNotNull(card.preterite, card.perfect).joinToString(" · ")
            val description = listOfNotNull(card.description, forms.takeIf(String::isNotBlank)).joinToString(" — ").takeIf(String::isNotBlank)
            try {
                personalWords.create(owner, PersonalWordRequest(card.german, card.english, request.category, description))
                added++
            } catch (_: ConflictException) {
                skipped++
            }
        }
        return AiDeckImportResult(added, skipped)
    }

    private fun clean(card: AiDeckCard): AiDeckCard {
        val german = card.german.trim()
        val english = card.english.trim()
        require(german.isNotBlank() && english.isNotBlank()) { "AI returned an empty card" }
        require(german.length <= 255 && english.length <= 255) { "AI returned a card that is too long" }
        val preterite = card.preterite.clean()
        val perfect = card.perfect.clean()
        require((preterite == null) == (perfect == null)) { "Irregular verb forms must include both Präteritum and Perfekt" }
        return card.copy(german = german, english = english, description = card.description.clean(), preterite = preterite, perfect = perfect)
    }

    private fun String?.clean() = this?.trim()?.takeIf(String::isNotBlank)
}
