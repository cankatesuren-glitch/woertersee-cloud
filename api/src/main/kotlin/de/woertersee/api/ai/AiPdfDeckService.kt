package de.woertersee.api.ai

import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile

@Service
class AiPdfDeckService(private val decks: AiDeckService) {
    fun generate(file: MultipartFile, level: String, cardCount: Int, category: String?): AiDeckPreview {
        require(!file.isEmpty) { "Choose a PDF file" }
        require(file.size <= MAX_FILE_SIZE) { "PDF files must be 10 MB or smaller" }
        require(file.originalFilename?.lowercase()?.endsWith(".pdf") == true) { "Only PDF files are supported" }
        require(cardCount in 1..50) { "Card count must be between 1 and 50" }
        require(level in SUPPORTED_LEVELS) { "Unsupported CEFR level" }

        val bytes = file.bytes
        require(bytes.size >= 5 && bytes.copyOfRange(0, 5).decodeToString() == "%PDF-") { "The uploaded file is not a valid PDF" }
        val text = try {
            Loader.loadPDF(bytes).use { document ->
                require(document.numberOfPages <= MAX_PAGES) { "PDF files may contain at most $MAX_PAGES pages" }
                PDFTextStripper().getText(document)
            }
        } catch (error: IllegalArgumentException) {
            throw error
        } catch (_: Exception) {
            throw IllegalArgumentException("The PDF could not be read")
        }
        val source = text.replace(Regex("[\\t ]+"), " ").replace(Regex("\\n{3,}"), "\n\n").trim()
        require(source.length >= 20) { "No readable text was found. Scanned PDFs need OCR before upload" }

        val fallbackCategory = file.originalFilename
            ?.substringBeforeLast('.')
            ?.trim()
            ?.takeIf(String::isNotBlank)
            ?.take(140)
            ?: "PDF vocabulary"
        val request = GenerateAiDeckRequest(
            topic = "Select useful German dictionary headwords that occur in this PDF text:\n${sample(source)}",
            level = level,
            cardCount = cardCount,
            category = category?.trim()?.takeIf(String::isNotBlank) ?: fallbackCategory,
        )
        return decks.generate(request)
    }

    private fun sample(text: String): String {
        if (text.length <= MAX_TEXT_LENGTH) return text
        val segmentLength = MAX_TEXT_LENGTH / SAMPLE_SEGMENTS
        val lastStart = text.length - segmentLength
        return (0 until SAMPLE_SEGMENTS).joinToString("\n\n") { index ->
            val start = (lastStart.toLong() * index / (SAMPLE_SEGMENTS - 1)).toInt()
            text.substring(start, start + segmentLength)
        }
    }

    private companion object {
        const val MAX_FILE_SIZE = 10L * 1024 * 1024
        const val MAX_PAGES = 100
        const val MAX_TEXT_LENGTH = 6_000
        const val SAMPLE_SEGMENTS = 6
        val SUPPORTED_LEVELS = setOf("A1", "A2", "B1", "B2", "C1")
    }
}
