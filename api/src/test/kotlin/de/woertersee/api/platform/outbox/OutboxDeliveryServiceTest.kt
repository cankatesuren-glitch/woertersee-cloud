package de.woertersee.api.platform.outbox

import io.micrometer.core.instrument.simple.SimpleMeterRegistry
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class OutboxDeliveryServiceTest {
    @Test
    fun `publishes a claimed event and marks it complete`() {
        val event = event()
        val repository = RecordingRepository(listOf(event))
        val delivered = mutableListOf<UUID>()
        val service = service(repository, DomainEventPublisher { delivered += it.eventId })

        service.publishBatch()

        assertEquals(listOf(event.eventId), delivered)
        assertEquals(listOf(event.eventId), repository.published)
        assertTrue(repository.failures.isEmpty())
    }

    @Test
    fun `retries a failed delivery with exponential backoff`() {
        val event = event(attempts = 2)
        val repository = RecordingRepository(listOf(event))
        val service = service(repository, DomainEventPublisher { error("broker unavailable") })

        service.publishBatch()

        val failure = repository.failures.single()
        assertEquals(3, failure.attempts)
        assertEquals(Duration.ofSeconds(8), failure.retryIn)
        assertFalse(failure.dead)
    }

    @Test
    fun `moves an exhausted delivery to the dead state`() {
        val event = event(attempts = 7)
        val repository = RecordingRepository(listOf(event))
        val service = service(repository, DomainEventPublisher { error("still unavailable") })

        service.publishBatch()

        assertTrue(repository.failures.single().dead)
    }

    @Test
    fun `caps exponential backoff`() {
        assertEquals(
            Duration.ofMinutes(5),
            OutboxDeliveryService.backoff(
                20,
                Duration.ofSeconds(2),
                Duration.ofMinutes(5),
            ),
        )
    }

    private fun service(repository: OutboxRepository, publisher: DomainEventPublisher) =
        OutboxDeliveryService(
            repository,
            publisher,
            OutboxProperties(),
            SimpleMeterRegistry(),
        )

    private fun event(attempts: Int = 0) = OutboxEvent(
        eventId = UUID.randomUUID(),
        eventType = "CardAnswered",
        eventVersion = 1,
        aggregateId = UUID.randomUUID(),
        userId = UUID.randomUUID(),
        occurredAt = Instant.parse("2026-08-16T12:00:00Z"),
        correlationId = UUID.randomUUID(),
        causationId = null,
        payload = ObjectMapper().readTree("""{"result":"KNOWN"}"""),
        attempts = attempts,
    )

    private class RecordingRepository(private val claimed: List<OutboxEvent>) : OutboxRepository {
        val published = mutableListOf<UUID>()
        val failures = mutableListOf<Failure>()

        override fun claim(limit: Int, lease: Duration) = claimed

        override fun published(eventId: UUID) {
            published += eventId
        }

        override fun failed(
            eventId: UUID,
            attempts: Int,
            retryIn: Duration,
            error: String,
            dead: Boolean,
        ) {
            failures += Failure(eventId, attempts, retryIn, error, dead)
        }
    }

    private data class Failure(
        val eventId: UUID,
        val attempts: Int,
        val retryIn: Duration,
        val error: String,
        val dead: Boolean,
    )
}
