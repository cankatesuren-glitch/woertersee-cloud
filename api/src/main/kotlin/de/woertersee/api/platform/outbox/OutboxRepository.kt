package de.woertersee.api.platform.outbox

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.time.Duration
import java.util.UUID

interface OutboxRepository {
    fun claim(limit: Int, lease: Duration): List<OutboxEvent>
    fun published(eventId: UUID)
    fun failed(eventId: UUID, attempts: Int, retryIn: Duration, error: String, dead: Boolean)
}

@Repository
class JdbcOutboxRepository(
    private val jdbc: JdbcClient,
    private val mapper: ObjectMapper,
) : OutboxRepository {
    @Transactional
    override fun claim(limit: Int, lease: Duration): List<OutboxEvent> = jdbc.sql(
        """WITH candidates AS (
               SELECT event_id FROM outbox_events
               WHERE (status = 'PENDING' AND next_attempt_at <= now())
                  OR (status = 'PROCESSING' AND next_attempt_at <= now())
               ORDER BY occurred_at
               FOR UPDATE SKIP LOCKED
               LIMIT :limit
           )
           UPDATE outbox_events event
              SET status = 'PROCESSING',
                  claimed_at = now(),
                  next_attempt_at = now() + (:lease_seconds * interval '1 second')
             FROM candidates
            WHERE event.event_id = candidates.event_id
        RETURNING event.event_id,event.event_type,event.event_version,event.aggregate_id,
                  event.user_id,event.occurred_at,event.correlation_id,event.causation_id,
                  event.payload::text,event.attempts""",
    ).param("limit", limit)
        .param("lease_seconds", lease.seconds)
        .query { rs, _ ->
            OutboxEvent(
                eventId = rs.getObject("event_id", UUID::class.java),
                eventType = rs.getString("event_type"),
                eventVersion = rs.getInt("event_version"),
                aggregateId = rs.getObject("aggregate_id", UUID::class.java),
                userId = rs.getObject("user_id", UUID::class.java),
                occurredAt = rs.getTimestamp("occurred_at").toInstant(),
                correlationId = rs.getObject("correlation_id", UUID::class.java),
                causationId = rs.getObject("causation_id", UUID::class.java),
                payload = mapper.readTree(rs.getString("payload")),
                attempts = rs.getInt("attempts"),
            )
        }.list()

    override fun published(eventId: UUID) {
        jdbc.sql(
            """UPDATE outbox_events
                  SET status='PUBLISHED',published_at=now(),claimed_at=NULL,last_error=NULL
                WHERE event_id=:id AND status='PROCESSING'""",
        ).param("id", eventId).update()
    }

    override fun failed(
        eventId: UUID,
        attempts: Int,
        retryIn: Duration,
        error: String,
        dead: Boolean,
    ) {
        jdbc.sql(
            """UPDATE outbox_events
                  SET status=:status,attempts=:attempts,claimed_at=NULL,last_error=:error,
                      next_attempt_at=now() + (:retry_seconds * interval '1 second')
                WHERE event_id=:id AND status='PROCESSING'""",
        ).param("id", eventId)
            .param("status", if (dead) "DEAD" else "PENDING")
            .param("attempts", attempts)
            .param("error", error.take(2_000))
            .param("retry_seconds", retryIn.seconds)
            .update()
    }
}
