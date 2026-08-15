package de.woertersee.api.learning

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.sql.DriverManager
import java.sql.SQLException
import java.util.UUID

@Testcontainers(disabledWithoutDocker = true)
class GameplaySchemaIntegrationTest {
    companion object {
        @Container val postgres = PostgreSQLContainer("postgres:17-alpine")
        @JvmStatic @BeforeAll fun migrate() {
            Flyway.configure().dataSource(postgres.jdbcUrl, postgres.username, postgres.password).load().migrate()
        }
    }

    @Test
    fun `database rejects duplicate words in one game`() {
        DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
            val profile = UUID.randomUUID(); val word = UUID.randomUUID(); val game = UUID.randomUUID()
            connection.prepareStatement("INSERT INTO profiles(id,issuer,subject) VALUES(?,?,?)").use { it.setObject(1,profile);it.setString(2,"test");it.setString(3,"user");it.executeUpdate() }
            connection.prepareStatement("INSERT INTO words(id,german,english,normalized_german) VALUES(?,?,?,?)").use { it.setObject(1,word);it.setString(2,"fahren");it.setString(3,"to drive");it.setString(4,"fahren");it.executeUpdate() }
            connection.prepareStatement("INSERT INTO game_sessions(id,profile_id,session_type,status,direction,ordering) VALUES(?,?,'ORIGINAL','ACTIVE','DE_EN','RANDOM')").use { it.setObject(1,game);it.setObject(2,profile);it.executeUpdate() }
            fun insertCard() = connection.prepareStatement("INSERT INTO game_session_cards(id,game_session_id,word_id,position,german_snapshot,english_snapshot) VALUES(?,?,?,?,?,?)").use { it.setObject(1,UUID.randomUUID());it.setObject(2,game);it.setObject(3,word);it.setInt(4,1);it.setString(5,"fahren");it.setString(6,"to drive");it.executeUpdate() }
            insertCard()
            assertThrows<SQLException> { insertCard() }
        }
    }
}
