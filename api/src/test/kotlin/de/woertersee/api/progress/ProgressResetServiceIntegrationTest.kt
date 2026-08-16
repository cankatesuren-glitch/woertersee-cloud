package de.woertersee.api.progress

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.util.UUID
import kotlin.test.assertEquals

@Testcontainers(disabledWithoutDocker = true)
class ProgressResetServiceIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var resets: ProgressResetService

        @JvmStatic
        @BeforeAll
        fun prepareDatabase() {
            Flyway.configure()
                .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
                .load()
                .migrate()

            val dataSource = DriverManagerDataSource(
                postgres.jdbcUrl,
                postgres.username,
                postgres.password,
            )
            jdbc = JdbcClient.create(dataSource)
            resets = ProgressResetService(jdbc)
        }
    }

    @Test
    fun `reset removes only the selected learner progress and writes an audit record`() {
        val learner = createProfile("reset-learner")
        val otherLearner = createProfile("other-learner")
        val word = createWord()
        createProgress(learner, word, "KNOWN")
        createProgress(otherLearner, word, "DIFFICULT")

        val result = resets.reset(
            learner,
            ResetProgressRequest(ResetType.LEARNING_PROGRESS, confirmed = true),
        )

        assertEquals(1, result.affectedRecords)
        assertEquals(0, progressCount(learner))
        assertEquals(1, progressCount(otherLearner))
        assertEquals(
            "LEARNING_PROGRESS",
            jdbc.sql(
                """SELECT metadata->>'reset_type' FROM audit_logs
                   WHERE actor_profile_id=:profile ORDER BY created_at DESC LIMIT 1""",
            ).param("profile", learner).query(String::class.java).single(),
        )
    }

    @Test
    fun `reset without explicit confirmation leaves progress unchanged`() {
        val learner = createProfile("unconfirmed-learner")
        val word = createWord()
        createProgress(learner, word, "KNOWN")

        assertThrows<IllegalArgumentException> {
            resets.reset(
                learner,
                ResetProgressRequest(ResetType.LEARNING_PROGRESS),
            )
        }

        assertEquals(1, progressCount(learner))
    }

    private fun createProfile(subject: String): UUID {
        val id = UUID.randomUUID()
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id", id)
            .param("subject", "$subject-$id")
            .update()
        return id
    }

    private fun createWord(): UUID {
        val id = UUID.randomUUID()
        jdbc.sql(
            """INSERT INTO words(id,german,english,normalized_german)
               VALUES(:id,:german,'test word',:normalized)""",
        ).param("id", id)
            .param("german", "Testwort-$id")
            .param("normalized", "testwort-$id")
            .update()
        return id
    }

    private fun createProgress(profile: UUID, word: UUID, state: String) {
        jdbc.sql(
            """INSERT INTO user_progress(id,profile_id,word_id,state)
               VALUES(:id,:profile,:word,:state)""",
        ).param("id", UUID.randomUUID())
            .param("profile", profile)
            .param("word", word)
            .param("state", state)
            .update()
    }

    private fun progressCount(profile: UUID) =
        jdbc.sql("SELECT count(*) FROM user_progress WHERE profile_id=:profile")
            .param("profile", profile)
            .query(Int::class.java)
            .single()
}
