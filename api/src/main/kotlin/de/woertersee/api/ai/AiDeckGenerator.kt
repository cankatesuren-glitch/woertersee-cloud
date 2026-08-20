package de.woertersee.api.ai

fun interface AiDeckGenerator {
    fun generate(request: GenerateAiDeckRequest): AiDeckPreview
}
