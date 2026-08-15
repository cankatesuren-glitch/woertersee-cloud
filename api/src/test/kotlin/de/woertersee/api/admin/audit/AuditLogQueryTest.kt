package de.woertersee.api.admin.audit

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class AuditLogQueryTest {
    @Test
    fun `rejects negative page numbers`() {
        assertThrows<IllegalArgumentException> {
            AuditLogQuery(null, null, null, -1, 25)
        }
    }

    @Test
    fun `rejects page sizes above the operational limit`() {
        assertThrows<IllegalArgumentException> {
            AuditLogQuery(null, null, null, 0, 101)
        }
    }
}
