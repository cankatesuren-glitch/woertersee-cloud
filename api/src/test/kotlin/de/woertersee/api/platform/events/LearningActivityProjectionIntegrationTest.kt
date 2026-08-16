package de.woertersee.api.platform.events

import de.woertersee.api.platform.outbox.DomainEventEnvelope
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import tools.jackson.databind.ObjectMapper
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals

@Testcontainers(disabledWithoutDocker = true)
class LearningActivityProjectionIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var projection: LearningActivityProjection

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
            projection = LearningActivityProjection(jdbc)
        }
    }

    @Test
    fun `duplicate delivery updates daily activity once`() {
        val profileId = insertProfile()
        val event = event("GameStarted", profileId)

        projection.process(event)
        projection.process(event)

        val counters = counters(profileId)
        assertEquals(1, counters.first)
        assertEquals(0, counters.second)
        assertEquals(1, processedCount(event.eventId))
    }

    @Test
    fun `started and completed events update separate counters`() {
        val profileId = insertProfile()

        projection.process(event("GameStarted", profileId))
        projection.process(event("GameCompleted", profileId))

        val counters = counters(profileId)
        assertEquals(1, counters.first)
        assertEquals(1, counters.second)
    }

    @Test
    fun `event for a deleted profile is acknowledged without a projection`() {
        val missingProfile = UUID.randomUUID()
        val event = event("GameStarted", missingProfile)

        projection.process(event)

        assertEquals(0, projectionCount(missingProfile))
        assertEquals(1, processedCount(event.eventId))
    }

    private fun insertProfile(): UUID {
        val id = UUID.randomUUID()
        jdbc.sql(
            """INSERT INTO profiles(id,issuer,subject,display_name)
               VALUES(:id,'test',:subject,'Event learner')""",
        ).param("id", id)
            .param("subject", id.toString())
            .update()
        return id
    }

    private fun event(type: String, profileId: UUID) = DomainEventEnvelope(
        eventId = UUID.randomUUID(),
        eventType = type,
        eventVersion = 1,
        aggregateId = UUID.randomUUID(),
        userId = profileId,
        occurredAt = Instant.parse("2026-08-16T12:00:00Z"),
        correlationId = UUID.randomUUID(),
        causationId = null,
        payload = ObjectMapper().createObjectNode(),
    )

    private fun counters(profileId: UUID) = jdbc.sql(
        """SELECT games_started,games_completed FROM learning_activity_daily
           WHERE profile_id=:profileId""",
    ).param("profileId", profileId)
        .query { rs, _ -> rs.getInt("games_started") to rs.getInt("games_completed") }
        .single()

    private fun processedCount(eventId: UUID) = jdbc.sql(
        """SELECT count(*) FROM processed_events
           WHERE consumer_name=:consumer AND event_id=:eventId""",
    ).param("consumer", LearningActivityProjection.CONSUMER_NAME)
        .param("eventId", eventId)
        .query(Int::class.java)
        .single()

    private fun projectionCount(profileId: UUID) = jdbc.sql(
        "SELECT count(*) FROM learning_activity_daily WHERE profile_id=:profileId",
    ).param("profileId", profileId)
        .query(Int::class.java)
        .single()
}
