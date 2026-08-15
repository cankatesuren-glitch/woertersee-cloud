package de.woertersee.api.admin.audit

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class AdminAuditService(private val jdbc: JdbcClient) {
    fun find(query: AuditLogQuery): AuditLogPage {
        val filters = mutableListOf<String>()
        val parameters = mutableMapOf<String, Any>()

        query.action?.trim()?.takeIf(String::isNotEmpty)?.let {
            filters += "a.action = :action"
            parameters["action"] = it
        }
        query.targetType?.trim()?.takeIf(String::isNotEmpty)?.let {
            filters += "a.target_type = :targetType"
            parameters["targetType"] = it
        }
        query.actorProfileId?.let {
            filters += "a.actor_profile_id = :actorProfileId"
            parameters["actorProfileId"] = it
        }

        val where = filters.takeIf { it.isNotEmpty() }?.joinToString(" AND ", " WHERE ") ?: ""
        val total = bind(jdbc.sql("SELECT count(*) FROM audit_logs a$where"), parameters)
            .query(Long::class.java)
            .single()

        val entries = bind(
            jdbc.sql(
                """SELECT a.id, a.actor_profile_id, p.display_name, a.action, a.target_type,
                          a.target_id, a.metadata::text, a.correlation_id, a.created_at
                   FROM audit_logs a
                   LEFT JOIN profiles p ON p.id = a.actor_profile_id
                   $where
                   ORDER BY a.created_at DESC, a.id DESC
                   LIMIT :limit OFFSET :offset""",
            ),
            parameters + mapOf("limit" to query.size, "offset" to query.page * query.size),
        ).query { result, _ ->
            AuditLogEntry(
                id = result.getObject("id", UUID::class.java),
                actorProfileId = result.getObject("actor_profile_id", UUID::class.java),
                actorName = result.getString("display_name"),
                action = result.getString("action"),
                targetType = result.getString("target_type"),
                targetId = result.getObject("target_id", UUID::class.java),
                metadata = result.getString("metadata"),
                correlationId = result.getObject("correlation_id", UUID::class.java),
                createdAt = result.getTimestamp("created_at").toInstant(),
            )
        }.list()

        return AuditLogPage(entries, query.page, query.size, total)
    }

    private fun bind(
        statement: JdbcClient.StatementSpec,
        parameters: Map<String, Any>,
    ): JdbcClient.StatementSpec = parameters.entries.fold(statement) { current, (name, value) ->
        current.param(name, value)
    }
}
