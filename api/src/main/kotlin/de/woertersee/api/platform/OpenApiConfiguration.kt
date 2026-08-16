package de.woertersee.api.platform

import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class OpenApiConfiguration {
    @Bean
    fun apiDefinition() = OpenAPI()
        .info(
            Info()
                .title("WörterSee Cloud API")
                .description("Versioned contracts for vocabulary, learning and account data.")
                .version("1.0.0")
                .contact(Contact().name("WörterSee Cloud")),
        )
        .components(
            Components().addSecuritySchemes(
                BEARER_AUTH,
                SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("OIDC access token issued for the WörterSee API."),
            ),
        )

    @Bean
    fun operationSecurity() = OpenApiCustomizer { openApi ->
        openApi.paths.orEmpty().forEach { (path, pathItem) ->
            pathItem.readOperations().forEach { operation ->
                operation.security = if (path.startsWith(PUBLIC_VOCABULARY_PATH)) {
                    emptyList()
                } else {
                    listOf(SecurityRequirement().addList(BEARER_AUTH))
                }
            }
        }
    }

    private companion object {
        const val BEARER_AUTH = "bearerAuth"
        const val PUBLIC_VOCABULARY_PATH = "/api/v1/vocabulary"
    }
}
