package de.woertersee.api.notification

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals

@Testcontainers(disabledWithoutDocker = true)
class PracticeReminderSchedulerIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")
        private lateinit var jdbc: JdbcClient
        private lateinit var queue: PracticeReminderQueue

        @JvmStatic
        @BeforeAll
        fun prepareDatabase() {
            Flyway.configure().dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .load().migrate()
            jdbc = JdbcClient.create(
                DriverManagerDataSource(postgres.jdbcUrl, postgres.username, postgres.password),
            )
            queue = PracticeReminderQueue(jdbc)
        }
    }

    @BeforeEach
    fun clearProfiles() {
        jdbc.sql("TRUNCATE profiles CASCADE").update()
    }

    @Test
    fun `due reminder is queued once per learner day`() {
        createProfile(true, "18:00", "Europe/Berlin")
        createProfile(true, "20:00", "Europe/Berlin")
        createProfile(false, "18:00", "Europe/Berlin")
        val now = Instant.parse("2026-08-16T17:00:00Z")

        assertEquals(1, queue.enqueueDue(now))
        assertEquals(0, queue.enqueueDue(now))
        assertEquals(1, count("practice_reminder_deliveries"))
        assertEquals(1, count("outbox_events", "event_type='PracticeReminderDue'"))
    }

    @Test
    fun `same instant respects each learner timezone`() {
        createProfile(true, "19:30", "Europe/Vienna")
        createProfile(true, "19:30", "America/New_York")

        assertEquals(1, queue.enqueueDue(Instant.parse("2026-08-17T17:30:00Z")))
    }

    private fun createProfile(enabled: Boolean, time: String, timezone: String) {
        val id = UUID.randomUUID()
        jdbc.sql(
            """INSERT INTO profiles(id,issuer,subject,practice_reminder_enabled,
                 practice_reminder_time,practice_reminder_timezone)
               VALUES(:id,'test',:subject,:enabled,CAST(:time AS time),:timezone)""",
        ).param("id", id).param("subject", id.toString()).param("enabled", enabled)
            .param("time", time).param("timezone", timezone).update()
    }

    private fun count(table: String, condition: String = "true") =
        jdbc.sql("SELECT count(*) FROM $table WHERE $condition").query(Int::class.java).single()
}
