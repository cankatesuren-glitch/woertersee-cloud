package de.woertersee.api.identity

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse

@Testcontainers(disabledWithoutDocker = true)
class PracticeReminderIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")
        private lateinit var jdbc: JdbcClient
        private lateinit var profiles: CurrentProfileService

        @JvmStatic
        @BeforeAll
        fun prepareDatabase() {
            Flyway.configure().dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .load().migrate()
            jdbc = JdbcClient.create(
                DriverManagerDataSource(postgres.jdbcUrl, postgres.username, postgres.password),
            )
            profiles = CurrentProfileService(jdbc)
        }
    }

    @Test
    fun `learner can configure a local practice reminder`() {
        val profileId = UUID.randomUUID()
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id", profileId).param("subject", profileId.toString()).update()

        assertFalse(profiles.practiceReminder(profileId).enabled)
        val saved = profiles.updatePracticeReminder(
            profileId,
            PracticeReminderRequest(true, LocalTime.of(19, 30), "Europe/Vienna"),
        )

        assertEquals(PracticeReminderPreference(true, LocalTime.of(19, 30), "Europe/Vienna"), saved)
        assertEquals(saved, profiles.practiceReminder(profileId))
        assertEquals(
            "PracticeReminderPreferenceChanged",
            jdbc.sql("SELECT event_type FROM outbox_events WHERE aggregate_id=:profileId")
                .param("profileId", profileId).query(String::class.java).single(),
        )
    }
}
