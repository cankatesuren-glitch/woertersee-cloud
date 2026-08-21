package de.woertersee.api.learning

import de.woertersee.api.learning.model.StartGameRequest
import de.woertersee.api.personalwords.PersonalWordService
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
class PersonalCategoryGameIntegrationTest {
    companion object {
        @Container val postgres = PostgreSQLContainer("postgres:17-alpine")
        private lateinit var jdbc: JdbcClient
        private lateinit var games: GameService
        private lateinit var words: PersonalWordService

        @JvmStatic @BeforeAll fun prepare() {
            Flyway.configure().dataSource(postgres.jdbcUrl,postgres.username,postgres.password).load().migrate()
            jdbc = JdbcClient.create(DriverManagerDataSource(postgres.jdbcUrl,postgres.username,postgres.password))
            games = GameService(jdbc)
            words = PersonalWordService(jdbc)
        }
    }

    @Test
    fun `personal category summary and game remain scoped to their owner`() {
        val owner = profile()
        val otherOwner = profile()
        personalWord(owner,"der Mietvertrag","rental agreement","Housing")
        personalWord(owner,"die Miete","rent","Housing")
        personalWord(owner,"der Husten","cough","Doctor")
        personalWord(otherOwner,"die Wohnung","apartment","Housing")

        assertEquals(listOf("Doctor" to 1,"Housing" to 2),words.categories(owner).map { it.name to it.wordCount })

        val game = games.start(owner,StartGameRequest(personalCategories=setOf("Housing"),cardCount=10))
        assertEquals(setOf("der Mietvertrag","die Miete"),game.cards.map { it.front }.toSet())
        assertEquals(setOf("PERSONAL"),game.cards.map { it.source }.toSet())
    }

    private fun profile(): UUID = UUID.randomUUID().also { id ->
        jdbc.sql("INSERT INTO profiles(id,issuer,subject) VALUES(:id,'test',:subject)")
            .param("id",id).param("subject",id.toString()).update()
    }

    private fun personalWord(owner:UUID,german:String,english:String,category:String) {
        jdbc.sql("""INSERT INTO personal_words(id,profile_id,german,english,normalized_german,category)
            VALUES(:id,:owner,:german,:english,:normalized,:category)""")
            .param("id",UUID.randomUUID()).param("owner",owner).param("german",german)
            .param("english",english).param("normalized",german.lowercase()).param("category",category).update()
    }
}
