package de.woertersee.api.admin.audit

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
class AdminAuditController(private val audit: AdminAuditService) {
    @GetMapping
    fun find(
        @RequestParam(required = false) action: String?,
        @RequestParam(required = false) targetType: String?,
        @RequestParam(required = false) actorProfileId: UUID?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "25") size: Int,
    ) = audit.find(AuditLogQuery(action, targetType, actorProfileId, page, size))
}
