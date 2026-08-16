package de.woertersee.api.identity

import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalTime
import java.util.UUID

data class CurrentProfile(val id: UUID, val displayName: String?, val dailyGoalGames: Int)
data class DailyGoalRequest(@field:Min(1) @field:Max(10) val games: Int)
data class DailyGoalPreference(val games: Int)
data class PracticeReminderRequest(
    val enabled: Boolean,
    val localTime: LocalTime,
    @field:NotBlank val timezone: String,
)
data class PracticeReminderPreference(
    val enabled: Boolean,
    val localTime: LocalTime,
    val timezone: String,
)

@RestController
@RequestMapping("/api/v1/profile")
class ProfileController(private val profiles: CurrentProfileService) {
    @GetMapping
    fun current(@AuthenticationPrincipal jwt: Jwt): CurrentProfile {
        val profileId = profiles.resolve(jwt)
        return profiles.find(profileId)
    }

    @PutMapping("/learning-goal")
    fun updateDailyGoal(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: DailyGoalRequest,
    ) = profiles.updateDailyGoal(profiles.resolve(jwt), request.games)

    @GetMapping("/practice-reminder")
    fun practiceReminder(@AuthenticationPrincipal jwt: Jwt) =
        profiles.practiceReminder(profiles.resolve(jwt))

    @PutMapping("/practice-reminder")
    fun updatePracticeReminder(
        @AuthenticationPrincipal jwt: Jwt,
        @Valid @RequestBody request: PracticeReminderRequest,
    ) = profiles.updatePracticeReminder(profiles.resolve(jwt), request)
}
