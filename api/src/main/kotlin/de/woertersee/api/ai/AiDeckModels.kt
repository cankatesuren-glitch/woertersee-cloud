package de.woertersee.api.ai

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class GenerateAiDeckRequest(
    @field:NotBlank @field:Size(max = 300) val topic: String,
    @field:Size(max = 20) val level: String = "B1",
    @field:Min(1) @field:Max(50) val cardCount: Int = 10,
    @field:Size(max = 140) val category: String? = null,
)

data class AiDeckCard(
    @field:NotBlank @field:Size(max = 255) val german: String,
    @field:NotBlank @field:Size(max = 255) val english: String,
    @field:Size(max = 1000) val description: String? = null,
    @field:Size(max = 120) val preterite: String? = null,
    @field:Size(max = 120) val perfect: String? = null,
)

data class AiDeckPreview(
    val title: String,
    val category: String,
    val cards: List<AiDeckCard>,
)

data class ImportAiDeckRequest(
    @field:Size(max = 140) val category: String? = null,
    @field:Valid @field:Size(min = 1, max = 50) val cards: List<AiDeckCard>,
)

data class AiDeckImportResult(val added: Int, val skipped: Int)
