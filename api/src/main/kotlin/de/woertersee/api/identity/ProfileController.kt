package de.woertersee.api.identity

import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class CurrentProfile(val id: UUID, val displayName: String?)

@RestController
@RequestMapping("/api/v1/profile")
class ProfileController(private val profiles: CurrentProfileService) {
    @GetMapping
    fun current(@AuthenticationPrincipal jwt: Jwt): CurrentProfile {
        val profileId = profiles.resolve(jwt)
        return profiles.find(profileId)
    }
}
