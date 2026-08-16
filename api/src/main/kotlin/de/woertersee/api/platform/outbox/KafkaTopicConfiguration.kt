package de.woertersee.api.platform.outbox

import org.apache.kafka.clients.admin.NewTopic
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class KafkaTopicConfiguration {
    @Bean
    fun domainEventsTopic(properties: OutboxProperties) =
        NewTopic(properties.topic, 6, 1.toShort())
}
