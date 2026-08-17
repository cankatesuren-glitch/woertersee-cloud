package de.woertersee.api.progress

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
import kotlin.test.assertNotNull

@Testcontainers(disabledWithoutDocker = true)
class TodayDashboardIntegrationTest {
    companion object {
        @Container
        val postgres = PostgreSQLContainer("postgres:17-alpine")

        private lateinit var jdbc: JdbcClient
        private lateinit var dashboard: ProgressDashboardService

        @JvmStatic
        @BeforeAll
        fun prepare() {
            Flyway.configure().dataSource(postgres.jdbcUrl,postgres.username,postgres.password).load().migrate()
            jdbc = JdbcClient.create(DriverManagerDataSource(postgres.jdbcUrl,postgres.username,postgres.password))
            dashboard = ProgressDashboardService(jdbc,LearningActivityQuery(jdbc))
        }
    }

    @Test
    fun `today summary separates due new and upcoming words`() {
        val profileId = UUID.randomUUID()
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id",profileId).param("subject",profileId.toString()).update()
        val dueWord = insertWord("abholen","to pick up")
        val upcomingWord = insertWord("erkennen","to recognise")
        insertWord("beginnen","to begin")
        insertProgress(profileId,dueWord,"DIFFICULT","now() - interval '1 minute'")
        insertProgress(profileId,upcomingWord,"KNOWN","now() + interval '2 days'")

        val today = dashboard.get(profileId).today

        assertEquals(1,today.dueWords)
        assertEquals(1,today.newWords)
        assertEquals(1,today.recommendedCards)
        assertNotNull(today.nextReviewAt)
    }

    private fun insertWord(german:String,english:String):UUID {
        val id=UUID.randomUUID()
        jdbc.sql("INSERT INTO words(id,german,english,normalized_german) VALUES(:id,:german,:english,:german)")
            .param("id",id).param("german",german).param("english",english).update()
        return id
    }

    private fun insertProgress(profileId:UUID,wordId:UUID,state:String,nextReviewSql:String) {
        jdbc.sql("""INSERT INTO user_progress(id,profile_id,word_id,state,next_review_at)
                    VALUES(:id,:profileId,:wordId,:state,$nextReviewSql)""")
            .param("id",UUID.randomUUID()).param("profileId",profileId)
            .param("wordId",wordId).param("state",state).update()
    }
}
