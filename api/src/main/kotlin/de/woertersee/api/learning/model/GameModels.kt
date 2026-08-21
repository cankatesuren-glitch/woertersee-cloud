package de.woertersee.api.learning.model

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import java.time.Instant
import java.util.UUID

enum class Direction { DE_EN, EN_DE }
enum class Ordering { RANDOM, AZ }
enum class AnswerResult { KNOWN, DIFFICULT }
enum class SessionType { ORIGINAL, REVIEW, REPLAY }

data class StartGameRequest(
    val wordIds: Set<UUID> = emptySet(),
    val personalWordIds: Set<UUID> = emptySet(),
    val categoryIds: Set<UUID> = emptySet(),
    val personalCategories: Set<String> = emptySet(),
    @field:Min(1) @field:Max(100) val cardCount: Int = 10,
    val unseenOnly: Boolean = false,
    val direction: Direction = Direction.DE_EN,
    val ordering: Ordering = Ordering.RANDOM
)

data class AnswerCardRequest(val result: AnswerResult)

data class GameCard(
    val id: UUID,
    val wordId: UUID,
    val source: String,
    val position: Int,
    val front: String,
    val back: String,
    val forms: List<String>,
    val result: AnswerResult?,
    val nextReviewAt: Instant?,
)

data class GameSessionView(
    val id: UUID,
    val rootSessionId: UUID,
    val type: SessionType,
    val status: String,
    val direction: Direction,
    val cards: List<GameCard>,
    val answered: Int,
    val known: Int,
    val difficult: Int,
    val accuracy: Double?
)

data class WordCandidate(val id: UUID, val source: String, val german: String, val english: String, val forms: List<String>)

data class SessionRow(
    val id: UUID,
    val profileId: UUID,
    val rootSessionId: UUID?,
    val type: SessionType,
    val status: String,
    val direction: Direction,
    val ordering: Ordering,
    val updatedAt: Instant
)
