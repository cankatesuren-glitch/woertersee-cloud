package de.woertersee.api.platform.outbox

import org.apache.kafka.clients.producer.ProducerRecord
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

fun interface DomainEventPublisher {
    fun publish(event: OutboxEvent)
}

@Component
class KafkaDomainEventPublisher(
    private val kafka: KafkaTemplate<String, String>,
    private val mapper: ObjectMapper,
    private val properties: OutboxProperties,
) : DomainEventPublisher {
    override fun publish(event: OutboxEvent) {
        val record = ProducerRecord(
            properties.topic,
            event.aggregateId.toString(),
            mapper.writeValueAsString(event.envelope()),
        )
        record.headers()
            .add("event_id", event.eventId.toString().toByteArray())
            .add("event_type", event.eventType.toByteArray())
            .add("event_version", event.eventVersion.toString().toByteArray())
            .add("correlation_id", event.correlationId.toString().toByteArray())
        kafka.send(record).get(properties.sendTimeout.toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS)
    }
}
