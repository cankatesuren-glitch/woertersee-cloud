package de.woertersee.api.platform

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.core.authority.SimpleGrantedAuthority

@Configuration
class SecurityConfiguration {
    @Bean
    fun jwtAuthenticationConverter() = JwtAuthenticationConverter().apply {
        setJwtGrantedAuthoritiesConverter { jwt ->
            val access = jwt.getClaimAsMap("realm_access") ?: emptyMap<String, Any>()
            @Suppress("UNCHECKED_CAST")
            val roles = access["roles"] as? Collection<String> ?: emptyList()
            roles.map { SimpleGrantedAuthority("ROLE_${it.uppercase()}") }
        }
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity, converter: JwtAuthenticationConverter): SecurityFilterChain = http
        .csrf { it.disable() }
        .authorizeHttpRequests {
            it.requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
            it.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
            it.requestMatchers(HttpMethod.GET, "/api/v1/vocabulary/**").permitAll()
            it.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            it.anyRequest().authenticated()
        }
        .oauth2ResourceServer { it.jwt { jwt -> jwt.jwtAuthenticationConverter(converter) } }
        .build()
}
