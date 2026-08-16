package de.woertersee.api.progress

import de.woertersee.api.identity.CurrentProfileService
import de.woertersee.api.platform.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@WebMvcTest(ProgressController::class)
@Import(SecurityConfiguration::class)
class ProgressResetAuthorizationTest(@Autowired private val mockMvc: MockMvc) {
    @MockitoBean
    private lateinit var profiles: CurrentProfileService

    @MockitoBean
    private lateinit var resets: ProgressResetService

    @Test
    fun `anonymous visitor cannot reset learner progress`() {
        mockMvc.post("/api/v1/progress/reset") {
            contentType = MediaType.APPLICATION_JSON
            content = """{"type":"ALL_PROGRESS","confirmed":true}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }
}
