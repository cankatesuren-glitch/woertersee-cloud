package de.woertersee.api.progress

import de.woertersee.api.identity.CurrentProfileService
import de.woertersee.api.platform.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@WebMvcTest(ProgressDashboardController::class)
@Import(SecurityConfiguration::class)
class ProgressDashboardAuthorizationTest(@Autowired private val mockMvc: MockMvc) {
    @MockitoBean
    private lateinit var profiles: CurrentProfileService

    @MockitoBean
    private lateinit var dashboard: ProgressDashboardService

    @Test
    fun `anonymous visitor cannot read learner progress`() {
        mockMvc.get("/api/v1/progress").andExpect {
            status { isUnauthorized() }
        }
    }
}
