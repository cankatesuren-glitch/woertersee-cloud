package de.woertersee.api.progress

import de.woertersee.api.identity.CurrentProfileService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/progress")
class ProgressDashboardController(
    private val profiles: CurrentProfileService,
    private val dashboard: ProgressDashboardService,
) {
    @GetMapping
    fun get(@AuthenticationPrincipal jwt: Jwt) = dashboard.get(profiles.resolve(jwt))
}
