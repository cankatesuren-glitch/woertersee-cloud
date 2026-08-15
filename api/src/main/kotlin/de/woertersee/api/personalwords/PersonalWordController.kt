package de.woertersee.api.personalwords
import de.woertersee.api.identity.CurrentProfileService
import jakarta.validation.Valid
import org.springframework.http.*
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID
@RestController @RequestMapping("/api/v1/personal-words")
class PersonalWordController(private val profiles:CurrentProfileService,private val words:PersonalWordService){
 @GetMapping fun list(@AuthenticationPrincipal jwt:Jwt)=words.list(profiles.resolve(jwt))
 @PostMapping @ResponseStatus(HttpStatus.CREATED) fun create(@AuthenticationPrincipal jwt:Jwt,@Valid @RequestBody body:PersonalWordRequest)=words.create(profiles.resolve(jwt),body)
 @PutMapping("/{id}") fun update(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID,@RequestHeader("If-Match") version:Long,@Valid @RequestBody body:PersonalWordRequest)=words.update(profiles.resolve(jwt),id,body,version)
 @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) fun delete(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID)=words.delete(profiles.resolve(jwt),id)
 @PostMapping("/csv/preview",consumes=["text/csv"]) fun preview(@AuthenticationPrincipal jwt:Jwt,@RequestBody csv:String)=words.preview(profiles.resolve(jwt),csv)
 @PostMapping("/csv/import",consumes=["text/csv"]) fun importCsv(@AuthenticationPrincipal jwt:Jwt,@RequestBody csv:String)=words.import(profiles.resolve(jwt),csv)
 @GetMapping("/csv/export",produces=["text/csv"]) fun export(@AuthenticationPrincipal jwt:Jwt)=ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=woertersee-personal-words.csv").body(words.export(profiles.resolve(jwt)))
}
