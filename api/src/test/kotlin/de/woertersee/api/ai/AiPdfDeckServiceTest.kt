package de.woertersee.api.ai

import de.woertersee.api.personalwords.PersonalWordService
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.pdmodel.PDPage
import org.apache.pdfbox.pdmodel.PDPageContentStream
import org.apache.pdfbox.pdmodel.font.PDType1Font
import org.apache.pdfbox.pdmodel.font.Standard14Fonts
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import org.springframework.mock.web.MockMultipartFile
import java.io.ByteArrayOutputStream
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AiPdfDeckServiceTest {
    @Test
    fun `extracts PDF text and uses filename as the default category`() {
        val preview = AiDeckPreview("Housing", "Kapitel 4", listOf(AiDeckCard("der Mietvertrag", "rental agreement")))
        lateinit var captured: GenerateAiDeckRequest
        val decks = AiDeckService(AiDeckGenerator { request -> captured = request; preview }, mock(PersonalWordService::class.java))
        val service = AiPdfDeckService(decks)
        val file = MockMultipartFile("file", "Kapitel 4.pdf", "application/pdf", pdfWith("Der Mietvertrag und die Miete sind wichtig."))

        val result = service.generate(file, "B1", 10, null)

        assertTrue(captured.topic.contains("Mietvertrag"))
        assertEquals("Kapitel 4", captured.category)
        assertEquals(preview, result)
    }

    @Test
    fun `rejects PDFs without readable text`() {
        val service = AiPdfDeckService(mock(AiDeckService::class.java))
        val file = MockMultipartFile("file", "scan.pdf", "application/pdf", pdfWith(""))

        val error = assertThrows<IllegalArgumentException> { service.generate(file, "B1", 10, null) }

        assertTrue(error.message!!.contains("No readable text"))
    }

    private fun pdfWith(text: String): ByteArray {
        val output = ByteArrayOutputStream()
        PDDocument().use { document ->
            val page = PDPage()
            document.addPage(page)
            if (text.isNotEmpty()) {
                PDPageContentStream(document, page).use { content ->
                    content.beginText()
                    content.setFont(PDType1Font(Standard14Fonts.FontName.HELVETICA), 12f)
                    content.newLineAtOffset(50f, 700f)
                    content.showText(text)
                    content.endText()
                }
            }
            document.save(output)
        }
        return output.toByteArray()
    }
}
