package de.woertersee.api.platform.outbox

import tools.jackson.databind.JsonNode
import java.time.Instant
import java.util.UUID

data class OutboxEvent(
    val eventId: UUID,
    val eventType: String,
    val eventVersion: Int,
    val aggregateId: UUID,
    val userId: UUID?,
    val occurredAt: Instant,
    val correlationId: UUID,
    val causationId: UUID?,
    val payload: JsonNode,
    val attempts: Int,
)

data class DomainEventEnvelope(
    val eventId: UUID,
    val eventType: String,
    val eventVersion: Int,
    val aggregateId: UUID,
    val userId: UUID?,
    val occurredAt: Instant,
    val correlationId: UUID,
    val causationId: UUID?,
    val payload: JsonNode,
)

fun OutboxEvent.envelope() = DomainEventEnvelope(
    eventId,
    eventType,
    eventVersion,
    aggregateId,
    userId,
    occurredAt,
    correlationId,
    causationId,
    payload,
)
