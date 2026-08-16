package de.woertersee.api.identity

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.UUID
import kotlin.test.assertEquals

@Testcontainers(disabledWithoutDocker = true)
class DailyGoalIntegrationTest {
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
    fun `learner can change the daily game goal`() {
        val profileId = UUID.randomUUID()
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id", profileId).param("subject", profileId.toString()).update()

        assertEquals(3, profiles.updateDailyGoal(profileId, 3).games)
        assertEquals(3, profiles.find(profileId).dailyGoalGames)
    }
}
