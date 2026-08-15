package de.woertersee.api.learning

import de.woertersee.api.identity.CurrentProfileService
import de.woertersee.api.learning.model.*
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/games")
class GameController(private val profiles: CurrentProfileService, private val games: GameService) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun start(@AuthenticationPrincipal jwt: Jwt, @Valid @RequestBody request: StartGameRequest) = games.start(profiles.resolve(jwt), request)

    @GetMapping("/{sessionId}")
    fun get(@AuthenticationPrincipal jwt: Jwt, @PathVariable sessionId: UUID) = games.get(profiles.resolve(jwt), sessionId)

    @PutMapping("/{sessionId}/cards/{cardId}/answer")
    fun answer(@AuthenticationPrincipal jwt: Jwt, @PathVariable sessionId: UUID, @PathVariable cardId: UUID,
               @RequestHeader("Idempotency-Key") key: String, @RequestBody request: AnswerCardRequest) =
        games.answer(profiles.resolve(jwt), sessionId, cardId, key, request.result)

    @PostMapping("/{sessionId}/finish")
    fun finish(@AuthenticationPrincipal jwt: Jwt, @PathVariable sessionId: UUID) = games.finish(profiles.resolve(jwt), sessionId)

    @PostMapping("/{sessionId}/review")
    @ResponseStatus(HttpStatus.CREATED)
    fun review(@AuthenticationPrincipal jwt: Jwt, @PathVariable sessionId: UUID) = games.review(profiles.resolve(jwt), sessionId)

    @PostMapping("/{sessionId}/replay")
    @ResponseStatus(HttpStatus.CREATED)
    fun replay(@AuthenticationPrincipal jwt: Jwt, @PathVariable sessionId: UUID) = games.replay(profiles.resolve(jwt), sessionId)
}

