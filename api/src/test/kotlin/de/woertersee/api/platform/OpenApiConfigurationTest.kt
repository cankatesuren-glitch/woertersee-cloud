package de.woertersee.api.platform

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.Operation
import io.swagger.v3.oas.models.PathItem
import io.swagger.v3.oas.models.Paths
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class OpenApiConfigurationTest {
    private val configuration = OpenApiConfiguration()

    @Test
    fun `publishes stable API metadata and a JWT bearer scheme`() {
        val api = configuration.apiDefinition()

        assertEquals("WörterSee Cloud API", api.info.title)
        assertEquals("1.0.0", api.info.version)
        val bearer = assertNotNull(api.components.securitySchemes["bearerAuth"])
        assertEquals("bearer", bearer.scheme)
        assertEquals("JWT", bearer.bearerFormat)
    }

    @Test
    fun `marks learner operations as protected and vocabulary reads as public`() {
        val vocabulary = Operation()
        val games = Operation()
        val api = OpenAPI().paths(
            Paths()
                .addPathItem(
                    "/api/v1/vocabulary/words",
                    PathItem().get(vocabulary),
                )
                .addPathItem("/api/v1/games", PathItem().post(games)),
        )

        configuration.operationSecurity().customise(api)

        assertTrue(vocabulary.security.isEmpty())
        assertEquals(listOf("bearerAuth"), games.security.single().keys.toList())
    }
}
