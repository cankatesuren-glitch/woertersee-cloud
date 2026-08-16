package de.woertersee.api.progress

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals

@Testcontainers(disabledWithoutDocker = true)
class LearningActivityQueryIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var query: LearningActivityQuery

        @JvmStatic
        @BeforeAll
        fun prepareDatabase() {
            Flyway.configure()
                .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .load()
                .migrate()
            jdbc = JdbcClient.create(
                DriverManagerDataSource(postgres.jdbcUrl, postgres.username, postgres.password),
            )
            query = LearningActivityQuery(jdbc)
        }
    }

    @Test
    fun `activity query fills missing days and calculates period totals`() {
        val profileId = insertProfile()
        insertActivity(profileId, LocalDate.parse("2026-08-13"), 2, 1)
        insertActivity(profileId, LocalDate.parse("2026-08-15"), 1, 1)

        val activity = query.get(profileId, periodDays = 5, today = LocalDate.parse("2026-08-16"))

        assertEquals(5, activity.days.size)
        assertEquals(3, activity.gamesStarted)
        assertEquals(2, activity.gamesCompleted)
        assertEquals(
            listOf(0, 2, 0, 1, 0),
            activity.days.map { it.gamesStarted },
        )
    }

    private fun insertProfile(): UUID {
        val id = UUID.randomUUID()
        jdbc.sql(
            "INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)",
        ).param("id", id).param("subject", id.toString()).update()
        return id
    }

    private fun insertActivity(profileId: UUID, date: LocalDate, started: Int, completed: Int) {
        jdbc.sql(
            """INSERT INTO learning_activity_daily(
                   profile_id,activity_date,games_started,games_completed,last_event_at
               ) VALUES(:profileId,:date,:started,:completed,now())""",
        ).param("profileId", profileId)
            .param("date", date)
            .param("started", started)
            .param("completed", completed)
            .update()
    }
}
