package de.woertersee.api.admin.vocabulary
import de.woertersee.api.identity.CurrentProfileService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.util.UUID
@RestController @RequestMapping("/api/v1/admin") class AdminVocabularyController(private val profiles:CurrentProfileService,private val vocabulary:AdminVocabularyService){
 @GetMapping("/words") fun words(@RequestParam(defaultValue="")query:String)=vocabulary.words(query)
 @PostMapping("/words") @ResponseStatus(HttpStatus.CREATED) fun createWord(@AuthenticationPrincipal jwt:Jwt,@Valid @RequestBody body:AdminWordRequest)=vocabulary.createWord(profiles.resolve(jwt),body)
 @PutMapping("/words/{id}") fun updateWord(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID,@RequestHeader("If-Match")version:Long,@Valid @RequestBody body:AdminWordRequest)=vocabulary.updateWord(profiles.resolve(jwt),id,version,body)
 @DeleteMapping("/words/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) fun deleteWord(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID)=vocabulary.deleteWord(profiles.resolve(jwt),id)
 @GetMapping("/categories") fun categories()=vocabulary.categories()
 @PostMapping("/categories") @ResponseStatus(HttpStatus.CREATED) fun createCategory(@AuthenticationPrincipal jwt:Jwt,@Valid @RequestBody body:CategoryRequest)=vocabulary.createCategory(profiles.resolve(jwt),body)
 @PutMapping("/categories/{id}") fun updateCategory(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID,@Valid @RequestBody body:CategoryRequest)=vocabulary.updateCategory(profiles.resolve(jwt),id,body)
 @DeleteMapping("/categories/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) fun deleteCategory(@AuthenticationPrincipal jwt:Jwt,@PathVariable id:UUID)=vocabulary.deleteCategory(profiles.resolve(jwt),id)
}
