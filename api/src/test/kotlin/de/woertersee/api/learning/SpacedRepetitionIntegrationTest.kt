package de.woertersee.api.learning

import de.woertersee.api.learning.model.AnswerResult
import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.jdbc.datasource.DriverManagerDataSource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.Duration
import java.time.Instant
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@Testcontainers(disabledWithoutDocker = true)
class SpacedRepetitionIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var games: GameService

        @JvmStatic
        @BeforeAll
        fun prepare() {
            Flyway.configure().dataSource(postgres.jdbcUrl, postgres.username, postgres.password).load().migrate()
            jdbc = JdbcClient.create(
                DriverManagerDataSource(postgres.jdbcUrl, postgres.username, postgres.password),
            )
            games = GameService(jdbc)
        }
    }

    @Test
    fun `answers persist a growing review schedule and difficult resets it`() {
        val profileId = UUID.randomUUID()
        val wordId = UUID.randomUUID()
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id",profileId).param("subject",profileId.toString()).update()
        jdbc.sql("INSERT INTO words(id,german,english,normalized_german) VALUES(:id,'fahren','to drive','fahren')")
            .param("id",wordId).update()

        answer(profileId,wordId,AnswerResult.KNOWN)
        var progress = progress(profileId,wordId)
        assertEquals(1,progress.first)
        assertEquals(1_440,progress.second)
        assertTrue(progress.third.isAfter(Instant.now().plus(Duration.ofHours(23))))

        answer(profileId,wordId,AnswerResult.KNOWN)
        progress = progress(profileId,wordId)
        assertEquals(2,progress.first)
        assertEquals(4_320,progress.second)

        answer(profileId,wordId,AnswerResult.DIFFICULT)
        progress = progress(profileId,wordId)
        assertEquals(0,progress.first)
        assertEquals(10,progress.second)
        assertTrue(progress.third.isBefore(Instant.now().plus(Duration.ofMinutes(11))))
    }

    private fun answer(profileId: UUID, wordId: UUID, result: AnswerResult) {
        val sessionId = UUID.randomUUID()
        val cardId = UUID.randomUUID()
        jdbc.sql("""INSERT INTO game_sessions(id,profile_id,session_type,status,direction,ordering)
                    VALUES(:id,:profileId,'ORIGINAL','ACTIVE','DE_EN','RANDOM')""")
            .param("id",sessionId).param("profileId",profileId).update()
        jdbc.sql("""INSERT INTO game_session_cards(id,game_session_id,word_id,position,german_snapshot,english_snapshot)
                    VALUES(:id,:sessionId,:wordId,0,'fahren','to drive')""")
            .param("id",cardId).param("sessionId",sessionId).param("wordId",wordId).update()
        games.answer(profileId,sessionId,cardId,UUID.randomUUID().toString(),result)
    }

    private fun progress(profileId: UUID, wordId: UUID): Triple<Int,Long,Instant> = jdbc.sql(
        """SELECT consecutive_known,review_interval_minutes,next_review_at
           FROM user_progress WHERE profile_id=:profileId AND word_id=:wordId"""
    ).param("profileId",profileId).param("wordId",wordId).query { rs, _ -> Triple(
        rs.getInt("consecutive_known"),
        rs.getLong("review_interval_minutes"),
        rs.getTimestamp("next_review_at").toInstant(),
    ) }.single()
}
