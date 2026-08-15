package de.woertersee.api.identity

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Service
import java.sql.Types
import java.util.UUID

@Service
class CurrentProfileService(private val jdbc: JdbcClient) {
    fun resolve(jwt: Jwt): UUID {
        val issuer = jwt.issuer?.toString() ?: "unknown"
        jdbc.sql(
            """INSERT INTO profiles (id, issuer, subject, display_name)
               VALUES (:id, :issuer, :subject, :name)
               ON CONFLICT (issuer, subject) DO UPDATE SET
                 display_name = COALESCE(EXCLUDED.display_name, profiles.display_name), updated_at = now()"""
        ).param("id", UUID.randomUUID())
            .param("issuer", issuer)
            .param("subject", jwt.subject)
            .param("name", jwt.getClaimAsString("name"), Types.VARCHAR)
            .update()

        return jdbc.sql(
            "SELECT id FROM profiles WHERE issuer = :issuer AND subject = :subject",
        ).param("issuer", issuer)
            .param("subject", jwt.subject)
            .query { result, _ -> UUID.fromString(result.getString("id")) }
            .single()
    }

    fun find(profileId: UUID): CurrentProfile = jdbc.sql(
        "SELECT id, display_name FROM profiles WHERE id = :id",
    ).param("id", profileId).query { result, _ ->
        CurrentProfile(
            id = result.getObject("id", UUID::class.java),
            displayName = result.getString("display_name"),
        )
    }.single()
}
