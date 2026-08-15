package de.woertersee.api.admin.audit

import java.time.Instant
import java.util.UUID

data class AuditLogEntry(
    val id: UUID,
    val actorProfileId: UUID?,
    val actorName: String?,
    val action: String,
    val targetType: String,
    val targetId: UUID?,
    val metadata: String,
    val correlationId: UUID?,
    val createdAt: Instant,
)

data class AuditLogPage(
    val items: List<AuditLogEntry>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
) {
    val totalPages: Int = if (totalElements == 0L) 0 else ((totalElements - 1) / size + 1).toInt()
}

data class AuditLogQuery(
    val action: String?,
    val targetType: String?,
    val actorProfileId: UUID?,
    val page: Int,
    val size: Int,
) {
    init {
        require(page >= 0) { "page must be zero or greater" }
        require(size in 1..100) { "size must be between 1 and 100" }
    }
}
