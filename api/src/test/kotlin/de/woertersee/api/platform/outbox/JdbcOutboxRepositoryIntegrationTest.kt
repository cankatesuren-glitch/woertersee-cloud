package de.woertersee.api.platform.outbox

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@Testcontainers(disabledWithoutDocker = true)
class JdbcOutboxRepositoryIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var repository: JdbcOutboxRepository

        @JvmStatic
        @BeforeAll
        fun prepareDatabase() {
            Flyway.configure()
                .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .load()
                .migrate()
            jdbc = JdbcClient.create(
                DriverManagerDataSource(
                    postgres.jdbcUrl,
                    postgres.username,
                    postgres.password,
                ),
            )
            repository = JdbcOutboxRepository(jdbc, ObjectMapper())
        }
    }

    @Test
    fun `claim lease prevents another worker from publishing the same event`() {
        val eventId = insertEvent()

        val firstClaim = repository.claim(10, Duration.ofSeconds(30))
        val competingClaim = repository.claim(10, Duration.ofSeconds(30))

        assertEquals(listOf(eventId), firstClaim.map { it.eventId })
        assertTrue(competingClaim.isEmpty())

        repository.published(eventId)
        assertEquals("PUBLISHED", status(eventId))
    }

    @Test
    fun `expired processing claim can be recovered`() {
        val eventId = insertEvent()
        repository.claim(10, Duration.ofSeconds(30))
        jdbc.sql(
            "UPDATE outbox_events SET next_attempt_at=now() - interval '1 second' WHERE event_id=:id",
        ).param("id", eventId).update()

        val recovered = repository.claim(10, Duration.ofSeconds(30))

        assertEquals(listOf(eventId), recovered.map { it.eventId })
    }

    private fun insertEvent(): UUID {
        val id = UUID.randomUUID()
        jdbc.sql(
            """INSERT INTO outbox_events(
                   event_id,event_type,event_version,aggregate_id,occurred_at,
                   correlation_id,payload
               ) VALUES(:id,'GameStarted',1,:aggregate,now(),:correlation,'{}')""",
        ).param("id", id)
            .param("aggregate", UUID.randomUUID())
            .param("correlation", UUID.randomUUID())
            .update()
        return id
    }

    private fun status(eventId: UUID) = jdbc.sql(
        "SELECT status FROM outbox_events WHERE event_id=:id",
    ).param("id", eventId).query(String::class.java).single()
}
