package de.woertersee.api.progress
import de.woertersee.api.identity.CurrentProfileService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
@RestController @RequestMapping("/api/v1/progress") class ProgressController(private val profiles:CurrentProfileService,private val resets:ProgressResetService){
 @PostMapping("/reset") fun reset(@AuthenticationPrincipal jwt:Jwt,@RequestBody request:ResetProgressRequest)=resets.reset(profiles.resolve(jwt),request)
}
