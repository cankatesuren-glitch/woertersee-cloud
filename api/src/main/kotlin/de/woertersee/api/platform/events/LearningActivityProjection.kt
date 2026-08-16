package de.woertersee.api.platform.events

import de.woertersee.api.platform.outbox.DomainEventEnvelope
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class LearningActivityProjection(private val jdbc: JdbcClient) {
    @Transactional
    fun process(event: DomainEventEnvelope) {
        require(event.eventVersion == 1) {
            "Unsupported ${event.eventType} event version ${event.eventVersion}"
        }

        val firstDelivery = jdbc.sql(
            """INSERT INTO processed_events(consumer_name,event_id)
               VALUES(:consumer,:eventId)
               ON CONFLICT DO NOTHING""",
        ).param("consumer", CONSUMER_NAME)
            .param("eventId", event.eventId)
            .update() == 1

        if (!firstDelivery) return
        val profileId = event.userId ?: return

        when (event.eventType) {
            "GameStarted" -> increment(profileId, event, started = 1, completed = 0)
            "GameCompleted" -> increment(profileId, event, started = 0, completed = 1)
        }
    }

    private fun increment(
        profileId: java.util.UUID,
        event: DomainEventEnvelope,
        started: Int,
        completed: Int,
    ) {
        jdbc.sql(
            """INSERT INTO learning_activity_daily(
                   profile_id,activity_date,games_started,games_completed,last_event_at
               )
               SELECT :profileId,:activityDate,:started,:completed,:occurredAt
               FROM profiles WHERE id=:profileId
               ON CONFLICT(profile_id,activity_date) DO UPDATE SET
                 games_started=learning_activity_daily.games_started+:started,
                 games_completed=learning_activity_daily.games_completed+:completed,
                 last_event_at=GREATEST(learning_activity_daily.last_event_at,:occurredAt),
                 updated_at=now()""",
        ).param("profileId", profileId)
            .param("activityDate", event.occurredAt.atZone(java.time.ZoneOffset.UTC).toLocalDate())
            .param("started", started)
            .param("completed", completed)
            .param("occurredAt", java.sql.Timestamp.from(event.occurredAt))
            .update()
    }

    companion object {
        const val CONSUMER_NAME = "learning-activity-v1"
    }
}
