package de.woertersee.api.identity

import de.woertersee.api.platform.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put

@WebMvcTest(ProfileController::class)
@Import(SecurityConfiguration::class)
class ProfileAuthorizationTest(@Autowired private val mockMvc: MockMvc) {
    @MockitoBean
    private lateinit var profiles: CurrentProfileService

    @Test
    fun `anonymous visitor cannot create or read a profile`() {
        mockMvc.get("/api/v1/profile").andExpect {
            status { isUnauthorized() }
        }
        mockMvc.put("/api/v1/profile/learning-goal") {
            contentType = org.springframework.http.MediaType.APPLICATION_JSON
            content = """{"games":3}"""
        }.andExpect {
            status { isUnauthorized() }
        }
        mockMvc.get("/api/v1/profile/practice-reminder").andExpect {
            status { isUnauthorized() }
        }
        mockMvc.put("/api/v1/profile/practice-reminder") {
            contentType = org.springframework.http.MediaType.APPLICATION_JSON
            content = """{"enabled":true,"localTime":"18:00","timezone":"Europe/Berlin"}"""
        }.andExpect {
            status { isUnauthorized() }
        }
    }
}
