package de.woertersee.api.platform.events

import de.woertersee.api.platform.outbox.DomainEventEnvelope
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper

@Component
class LearningDomainEventListener(
    private val mapper: ObjectMapper,
    private val projection: LearningActivityProjection,
) {
    @KafkaListener(
        topics = ["\${woertersee.outbox.topic:woertersee.domain-events.v1}"],
        groupId = LearningActivityProjection.CONSUMER_NAME,
    )
    fun receive(message: String) {
        projection.process(mapper.readValue(message, DomainEventEnvelope::class.java))
    }
}
