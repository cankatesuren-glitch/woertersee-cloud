package de.woertersee.api.platform.events

import de.woertersee.api.platform.outbox.OutboxProperties
import org.apache.kafka.clients.admin.NewTopic
import org.apache.kafka.common.TopicPartition
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer
import org.springframework.kafka.listener.DefaultErrorHandler
import org.springframework.util.backoff.FixedBackOff

@Configuration
class KafkaConsumerConfiguration {
    @Bean
    fun domainEventsDeadLetterTopic(properties: OutboxProperties) =
        NewTopic("${properties.topic}.dlt", 6, 1.toShort())

    @Bean
    fun kafkaErrorHandler(
        kafka: KafkaTemplate<String, String>,
        properties: OutboxProperties,
    ): DefaultErrorHandler {
        val recoverer = DeadLetterPublishingRecoverer(kafka) { record, _ ->
            TopicPartition("${properties.topic}.dlt", record.partition())
        }
        return DefaultErrorHandler(recoverer, FixedBackOff(1_000, 2))
    }
}
