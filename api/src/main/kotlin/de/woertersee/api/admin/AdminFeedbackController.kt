package de.woertersee.api.admin
import de.woertersee.api.feedback.*
import de.woertersee.api.identity.CurrentProfileService
import jakarta.validation.Valid
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.util.UUID
@RestController @RequestMapping("/api/v1/admin/feedback") class AdminFeedbackController(private val profiles:CurrentProfileService,private val feedback:FeedbackService){
 @GetMapping fun queue(@RequestParam(required=false) status:FeedbackStatus?)=feedback.adminQueue(status)
 @PatchMapping("/{id}") fun update(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID,@Valid @RequestBody body:AdminFeedbackUpdate)=feedback.updateByAdmin(profiles.resolve(jwt),id,body)
}

