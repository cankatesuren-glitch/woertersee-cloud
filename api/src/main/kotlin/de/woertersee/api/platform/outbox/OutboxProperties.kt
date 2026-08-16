package de.woertersee.api.platform.outbox

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties("woertersee.outbox")
data class OutboxProperties(
    val enabled: Boolean = true,
    val topic: String = "woertersee.domain-events.v1",
    val batchSize: Int = 50,
    val maxAttempts: Int = 8,
    val baseBackoff: Duration = Duration.ofSeconds(2),
    val maxBackoff: Duration = Duration.ofMinutes(5),
    val claimLease: Duration = Duration.ofSeconds(30),
    val sendTimeout: Duration = Duration.ofSeconds(10),
)
