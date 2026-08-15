package de.woertersee.api.platform.error

import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

class NotFoundException(message: String) : RuntimeException(message)
class ConflictException(message: String) : RuntimeException(message)

@RestControllerAdvice
class ApiErrorHandler {
    @ExceptionHandler(NotFoundException::class)
    fun notFound(error: NotFoundException) = problem(HttpStatus.NOT_FOUND, error.message ?: "Resource not found")

    @ExceptionHandler(ConflictException::class)
    fun conflict(error: ConflictException) = problem(HttpStatus.CONFLICT, error.message ?: "Request conflicts with current state")

    @ExceptionHandler(IllegalArgumentException::class, MethodArgumentNotValidException::class)
    fun invalid(error: Exception) = problem(HttpStatus.BAD_REQUEST, error.message ?: "Invalid request")

    private fun problem(status: HttpStatus, detail: String) =
        ProblemDetail.forStatusAndDetail(status, detail).apply { title = status.reasonPhrase }
}

