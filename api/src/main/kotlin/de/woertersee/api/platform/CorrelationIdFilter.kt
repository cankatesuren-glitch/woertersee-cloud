package de.woertersee.api.platform

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component
class CorrelationIdFilter : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, chain: FilterChain) {
        val correlationId = request.getHeader(HEADER)?.takeIf { runCatching { UUID.fromString(it) }.isSuccess }
            ?: UUID.randomUUID().toString()
        response.setHeader(HEADER, correlationId)
        MDC.put("correlation_id", correlationId)
        try { chain.doFilter(request, response) } finally { MDC.remove("correlation_id") }
    }

    private companion object { const val HEADER = "X-Correlation-ID" }
}

