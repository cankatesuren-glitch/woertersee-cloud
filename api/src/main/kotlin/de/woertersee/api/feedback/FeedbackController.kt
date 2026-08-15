package de.woertersee.api.feedback
import de.woertersee.api.identity.CurrentProfileService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
@RestController @RequestMapping("/api/v1/feedback") class FeedbackController(private val profiles:CurrentProfileService,private val feedback:FeedbackService){
 @GetMapping fun mine(@AuthenticationPrincipal jwt:Jwt)=feedback.mine(profiles.resolve(jwt))
 @PostMapping @ResponseStatus(HttpStatus.CREATED) fun submit(@AuthenticationPrincipal jwt:Jwt,@Valid @RequestBody body:FeedbackRequest)=feedback.submit(profiles.resolve(jwt),body)
}

