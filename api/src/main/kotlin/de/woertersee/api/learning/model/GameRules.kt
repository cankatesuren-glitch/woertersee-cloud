package de.woertersee.api.learning.model

object GameRules {
    fun accuracy(known: Int, difficult: Int): Double? {
        val answered = known + difficult
        return if (answered == 0) null else known * 100.0 / answered
    }

    fun reviewWordIds(cards: List<Pair<java.util.UUID, AnswerResult?>>): List<java.util.UUID> =
        cards.filter { it.second == AnswerResult.DIFFICULT }.map { it.first }.distinct()
}

