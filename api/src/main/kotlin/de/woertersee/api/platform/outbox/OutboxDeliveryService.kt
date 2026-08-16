package de.woertersee.api.platform.outbox

import io.micrometer.core.instrument.MeterRegistry
import org.slf4j.LoggerFactory
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Duration
import kotlin.math.min

@Service
@EnableConfigurationProperties(OutboxProperties::class)
class OutboxDeliveryService(
    private val repository: OutboxRepository,
    private val publisher: DomainEventPublisher,
    private val properties: OutboxProperties,
    meterRegistry: MeterRegistry,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val published = meterRegistry.counter("woertersee.outbox.published")
    private val failed = meterRegistry.counter("woertersee.outbox.failed")
    private val dead = meterRegistry.counter("woertersee.outbox.dead")

    @Scheduled(fixedDelayString = "\${woertersee.outbox.poll-interval:1000}")
    fun publishBatch() {
        if (!properties.enabled) return

        repository.claim(properties.batchSize, properties.claimLease).forEach { event ->
            runCatching { publisher.publish(event) }
                .onSuccess {
                    repository.published(event.eventId)
                    published.increment()
                }
                .onFailure { error -> handleFailure(event, error) }
        }
    }

    private fun handleFailure(event: OutboxEvent, error: Throwable) {
        val attempts = event.attempts + 1
        val exhausted = attempts >= properties.maxAttempts
        val retryIn = backoff(attempts, properties.baseBackoff, properties.maxBackoff)
        repository.failed(
            event.eventId,
            attempts,
            retryIn,
            error.message ?: error.javaClass.simpleName,
            exhausted,
        )
        failed.increment()
        if (exhausted) dead.increment()
        log.warn(
            "Outbox delivery failed eventId={} eventType={} attempts={} dead={}",
            event.eventId,
            event.eventType,
            attempts,
            exhausted,
            error,
        )
    }

    companion object {
        fun backoff(attempt: Int, base: Duration, maximum: Duration): Duration {
            val multiplier = 1L shl min((attempt - 1).coerceAtLeast(0), 30)
            val seconds = runCatching { Math.multiplyExact(base.seconds, multiplier) }
                .getOrDefault(maximum.seconds)
            return Duration.ofSeconds(min(seconds, maximum.seconds))
        }
    }
}
