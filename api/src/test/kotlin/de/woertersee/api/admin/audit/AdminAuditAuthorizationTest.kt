package de.woertersee.api.admin.audit

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

@WebMvcTest(AdminAuditController::class)
@Import(SecurityConfiguration::class)
class AdminAuditAuthorizationTest(@Autowired private val mockMvc: MockMvc) {
    @MockitoBean
    private lateinit var audit: AdminAuditService

    @Test
    fun `user role cannot read audit records`() {
        mockMvc.get("/api/v1/admin/audit-logs") {
            with(jwt().authorities(SimpleGrantedAuthority("ROLE_USER")))
        }.andExpect {
            status { isForbidden() }
        }
    }
}
