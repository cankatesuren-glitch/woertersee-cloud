package de.woertersee.api.notification

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class DuePracticeReminder(
    val deliveryId: UUID,
    val profileId: UUID,
    val reminderDate: LocalDate,
    val localTime: LocalTime,
    val timezone: String,
)

@Service
@ConditionalOnProperty(
    name = ["woertersee.reminders.enabled"],
    havingValue = "true",
    matchIfMissing = true,
)
class PracticeReminderScheduler(private val queue: PracticeReminderQueue) {
    private val log = LoggerFactory.getLogger(javaClass)

    @Scheduled(fixedDelayString = "\${woertersee.reminders.poll-interval:60000}")
    fun scheduleDueReminders() {
        val count = queue.enqueueDue(Instant.now())
        if (count > 0) log.info("Queued {} practice reminders", count)
    }
}

@Service
class PracticeReminderQueue(
    private val jdbc: JdbcClient,
) {
    @Transactional
    fun enqueueDue(now: Instant): Int {
        val due = jdbc.sql(
            """INSERT INTO practice_reminder_deliveries(
                 id,profile_id,reminder_date,local_time,timezone
               )
               SELECT gen_random_uuid(),p.id,
                 (CAST(:now AS timestamptz) AT TIME ZONE p.practice_reminder_timezone)::date,
                 p.practice_reminder_time,p.practice_reminder_timezone
               FROM profiles p
               WHERE p.practice_reminder_enabled
                 AND (CAST(:now AS timestamptz) AT TIME ZONE p.practice_reminder_timezone)::time >= p.practice_reminder_time
               ON CONFLICT (profile_id,reminder_date) DO NOTHING
               RETURNING id,profile_id,reminder_date,local_time,timezone""",
        ).param("now", now.toString()).query { result, _ ->
            DuePracticeReminder(
                deliveryId = result.getObject("id", UUID::class.java),
                profileId = result.getObject("profile_id", UUID::class.java),
                reminderDate = result.getDate("reminder_date").toLocalDate(),
                localTime = result.getTime("local_time").toLocalTime(),
                timezone = result.getString("timezone"),
            )
        }.list()

        due.forEach(::writeOutboxEvent)
        return due.size
    }

    private fun writeOutboxEvent(reminder: DuePracticeReminder) {
        jdbc.sql(
            """INSERT INTO outbox_events(event_id,event_type,event_version,aggregate_id,user_id,
                 occurred_at,correlation_id,payload)
               VALUES(:eventId,'PracticeReminderDue',1,:deliveryId,:profileId,now(),:correlation,
                 jsonb_build_object('delivery_id',:deliveryId,'profile_id',:profileId,
                 'reminder_date',:reminderDate,'local_time',:localTime,'timezone',:timezone))""",
        ).param("eventId", UUID.randomUUID())
            .param("deliveryId", reminder.deliveryId)
            .param("profileId", reminder.profileId)
            .param("correlation", UUID.randomUUID())
            .param("reminderDate", reminder.reminderDate.toString())
            .param("localTime", reminder.localTime.toString())
            .param("timezone", reminder.timezone)
            .update()
    }
}
