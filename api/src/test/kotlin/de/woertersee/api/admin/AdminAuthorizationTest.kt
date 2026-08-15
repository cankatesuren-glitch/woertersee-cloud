package de.woertersee.api.admin

import de.woertersee.api.admin.vocabulary.AdminVocabularyController
import de.woertersee.api.admin.vocabulary.AdminVocabularyService
import de.woertersee.api.identity.CurrentProfileService
import de.woertersee.api.platform.SecurityConfiguration
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt
import org.springframework.test.context.bean.override.mockito.MockitoBean
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@WebMvcTest(AdminVocabularyController::class)
@Import(SecurityConfiguration::class)
class AdminAuthorizationTest(@Autowired private val mockMvc: MockMvc) {
    @MockitoBean
    private lateinit var profiles: CurrentProfileService

    @MockitoBean
    private lateinit var vocabulary: AdminVocabularyService

    @Test
    fun `user role cannot access administration endpoints`() {
        mockMvc.get("/api/v1/admin/words") {
            with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER")))
        }.andExpect {
            status { isForbidden() }
        }
    }
}
