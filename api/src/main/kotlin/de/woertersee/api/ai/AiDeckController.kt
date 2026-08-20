package de.woertersee.api.ai

import de.woertersee.api.identity.CurrentProfileService
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/ai/decks")
class AiDeckController(private val profiles: CurrentProfileService, private val decks: AiDeckService) {
    @PostMapping("/generate")
    fun generate(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: GenerateAiDeckRequest): AiDeckPreview {
        profiles.resolve(jwt)
        return decks.generate(request)
    }

    @PostMapping("/import")
    fun import(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: ImportAiDeckRequest) =
        decks.import(profiles.resolve(jwt), request)
}
