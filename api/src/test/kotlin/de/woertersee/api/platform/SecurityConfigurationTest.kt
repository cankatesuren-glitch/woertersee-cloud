package de.woertersee.api.platform
import org.springframework.security.oauth2.jwt.Jwt
import kotlin.test.Test
import kotlin.test.assertTrue
class SecurityConfigurationTest{
 @Test fun `keycloak realm roles become spring roles`(){val jwt=Jwt.withTokenValue("test").header("alg","none").claim("sub","user").claim("realm_access",mapOf("roles" to listOf("user","admin"))).build();val names=SecurityConfiguration().jwtAuthenticationConverter().convert(jwt).authorities.map{it.authority}.toSet();assertTrue(names.containsAll(setOf("ROLE_USER","ROLE_ADMIN")))}
}
