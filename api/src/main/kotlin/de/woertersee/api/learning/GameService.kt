package de.woertersee.api.learning

import de.woertersee.api.learning.model.*
import de.woertersee.api.platform.error.ConflictException
import de.woertersee.api.platform.error.NotFoundException
import org.slf4j.MDC
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class GameService(private val jdbc: JdbcClient) {
    @Transactional
    fun start(profileId: UUID, request: StartGameRequest): GameSessionView {
        val candidates = selectCandidates(profileId, request)
        require(candidates.isNotEmpty()) { "No eligible words found" }
        val ordered = when (request.ordering) {
            Ordering.AZ -> candidates.sortedBy { it.german.lowercase() }
            Ordering.RANDOM -> candidates
        }.take(request.cardCount)
        return createSession(profileId, null, SessionType.ORIGINAL, request.direction, request.ordering, ordered)
    }

    @Transactional
    fun answer(profileId: UUID, sessionId: UUID, cardId: UUID, idempotencyKey: String, result: AnswerResult): GameSessionView {
        require(idempotencyKey.length in 8..100) { "Idempotency-Key must contain 8-100 characters" }
        val session = ownedSession(profileId, sessionId)
        if (session.status != "ACTIVE") throw ConflictException("Game is no longer active")

        val inserted = jdbc.sql(
            """INSERT INTO answer_attempts (id, game_session_id, card_id, profile_id, result, idempotency_key)
               SELECT :attemptId, c.game_session_id, c.id, :profileId, :result, :key
               FROM game_session_cards c WHERE c.id = :cardId AND c.game_session_id = :sessionId
               ON CONFLICT (profile_id, idempotency_key) DO NOTHING"""
        ).param("attemptId", UUID.randomUUID()).param("profileId", profileId).param("result", result.name)
            .param("key", idempotencyKey).param("cardId", cardId).param("sessionId", sessionId).update()
        if (inserted == 0) {
            val sameRequest = jdbc.sql("SELECT count(*) FROM answer_attempts WHERE profile_id=:profileId AND idempotency_key=:key AND card_id=:cardId AND result=:result")
                .param("profileId", profileId).param("key", idempotencyKey).param("cardId", cardId).param("result", result.name)
                .query(Int::class.java).single() == 1
            if (!sameRequest) throw ConflictException("Idempotency-Key was already used for another answer")
            return get(profileId, sessionId)
        }

        val updated = jdbc.sql("UPDATE game_session_cards SET result=:result, answered_at=now() WHERE id=:cardId AND game_session_id=:sessionId AND result IS NULL")
            .param("result", result.name).param("cardId", cardId).param("sessionId", sessionId).update()
        if (updated == 0) throw ConflictException("Card is missing or already answered")

        val source = jdbc.sql(
            """SELECT c.word_id,c.personal_word_id,
                      COALESCE(up.consecutive_known,pwp.consecutive_known,0) AS consecutive_known
               FROM game_session_cards c
               LEFT JOIN user_progress up ON up.profile_id=:profileId AND up.word_id=c.word_id
               LEFT JOIN personal_word_progress pwp ON pwp.profile_id=:profileId AND pwp.personal_word_id=c.personal_word_id
               WHERE c.id=:cardId"""
        ).param("profileId",profileId).param("cardId",cardId).query { rs, _ -> ProgressSource(
            rs.getObject("word_id",UUID::class.java),
            rs.getObject("personal_word_id",UUID::class.java),
            rs.getInt("consecutive_known"),
        ) }.single()
        val plan = ReviewScheduler.schedule(result, source.consecutiveKnown, Instant.now())
        source.globalWordId?.let { wordId -> jdbc.sql(
            """INSERT INTO user_progress (id, profile_id, word_id, state, total_attempts, known_attempts, last_played_at, consecutive_known, review_interval_minutes, next_review_at)
               VALUES (:id, :profileId, :wordId, :state, 1, :known, now(), :streak, :interval, CAST(:nextReviewAt AS timestamptz))
               ON CONFLICT (profile_id, word_id) DO UPDATE SET state=:state,
                 total_attempts=user_progress.total_attempts+1,
                 known_attempts=user_progress.known_attempts+:known,
                 last_played_at=now(), consecutive_known=:streak, review_interval_minutes=:interval,
                 next_review_at=CAST(:nextReviewAt AS timestamptz), updated_at=now(), version=user_progress.version+1"""
        ).param("id", UUID.randomUUID()).param("profileId", profileId).param("wordId", wordId)
            .param("state", if (result == AnswerResult.KNOWN) "KNOWN" else "DIFFICULT")
            .param("known", if (result == AnswerResult.KNOWN) 1 else 0)
            .param("streak",plan.consecutiveKnown).param("interval",plan.interval.toMinutes())
            .param("nextReviewAt",plan.nextReviewAt.toString()).update() }
        source.personalWordId?.let { wordId -> jdbc.sql(
            """INSERT INTO personal_word_progress(id,profile_id,personal_word_id,state,total_attempts,known_attempts,last_played_at,consecutive_known,review_interval_minutes,next_review_at)
               VALUES(:id,:profileId,:wordId,:state,1,:known,now(),:streak,:interval,CAST(:nextReviewAt AS timestamptz))
               ON CONFLICT(profile_id,personal_word_id) DO UPDATE SET state=:state,
                 total_attempts=personal_word_progress.total_attempts+1,
                 known_attempts=personal_word_progress.known_attempts+:known,
                 last_played_at=now(),consecutive_known=:streak,review_interval_minutes=:interval,
                 next_review_at=CAST(:nextReviewAt AS timestamptz),updated_at=now(),version=personal_word_progress.version+1"""
        ).param("id",UUID.randomUUID()).param("profileId",profileId).param("wordId",wordId)
            .param("state",if(result==AnswerResult.KNOWN)"KNOWN" else "DIFFICULT")
            .param("known",if(result==AnswerResult.KNOWN)1 else 0)
            .param("streak",plan.consecutiveKnown).param("interval",plan.interval.toMinutes())
            .param("nextReviewAt",plan.nextReviewAt.toString()).update() }
        outbox("CardAnswered", sessionId, profileId)
        return get(profileId, sessionId)
    }

    @Transactional
    fun finish(profileId: UUID, sessionId: UUID): GameSessionView {
        ownedSession(profileId, sessionId)
        jdbc.sql("UPDATE game_sessions SET status='COMPLETED', completed_at=now(), updated_at=now(), version=version+1 WHERE id=:id AND status='ACTIVE'")
            .param("id", sessionId).update()
        outbox("GameCompleted", sessionId, profileId)
        return get(profileId, sessionId)
    }

    @Transactional
    fun review(profileId: UUID, sessionId: UUID): GameSessionView {
        val source = ownedSession(profileId, sessionId)
        val rootId = source.rootSessionId ?: source.id
        val words = sessionWords(rootId, "AND c.result = 'DIFFICULT'")
        if (words.isEmpty()) throw ConflictException("The original game has no difficult words to review")
        return createSession(profileId, rootId, SessionType.REVIEW, source.direction, Ordering.RANDOM, words)
    }

    @Transactional
    fun replay(profileId: UUID, sessionId: UUID): GameSessionView {
        val source = ownedSession(profileId, sessionId)
        val rootId = source.rootSessionId ?: source.id
        val words = sessionWords(rootId, "")
        return createSession(profileId, rootId, SessionType.REPLAY, source.direction, source.ordering, words)
    }

    fun get(profileId: UUID, sessionId: UUID): GameSessionView {
        val session = ownedSession(profileId, sessionId)
        val cards = jdbc.sql(
            """SELECT c.id, c.word_id, c.personal_word_id, c.position, c.german_snapshot, c.english_snapshot,
                      c.present_form_snapshot, c.preterite_form_snapshot, c.perfect_form_snapshot, c.result,
                      COALESCE(up.next_review_at,pwp.next_review_at) AS next_review_at
               FROM game_session_cards c
               LEFT JOIN user_progress up ON up.profile_id=:profileId AND up.word_id=c.word_id
               LEFT JOIN personal_word_progress pwp ON pwp.profile_id=:profileId AND pwp.personal_word_id=c.personal_word_id
               WHERE c.game_session_id=:sessionId ORDER BY c.position"""
        ).param("profileId",profileId).param("sessionId", sessionId).query { rs, _ ->
            val german = rs.getString("german_snapshot")
            val english = rs.getString("english_snapshot")
            val globalId=rs.getObject("word_id",UUID::class.java)
            val personalId=rs.getObject("personal_word_id",UUID::class.java)
            GameCard(rs.getObject("id", UUID::class.java), globalId?:personalId, if(globalId!=null)"GLOBAL" else "PERSONAL", rs.getInt("position"),
                if (session.direction == Direction.DE_EN) german else english,
                if (session.direction == Direction.DE_EN) english else german,
                listOfNotNull(rs.getString("present_form_snapshot"), rs.getString("preterite_form_snapshot"), rs.getString("perfect_form_snapshot")),
                rs.getString("result")?.let(AnswerResult::valueOf),
                rs.getTimestamp("next_review_at")?.toInstant())
        }.list()
        val known = cards.count { it.result == AnswerResult.KNOWN }
        val difficult = cards.count { it.result == AnswerResult.DIFFICULT }
        return GameSessionView(session.id, session.rootSessionId ?: session.id, session.type, session.status, session.direction,
            cards, known + difficult, known, difficult, GameRules.accuracy(known, difficult))
    }

    private fun selectCandidates(profileId: UUID, request: StartGameRequest): List<WordCandidate> {
        val exact=mutableListOf<WordCandidate>()
        if (request.wordIds.isNotEmpty()) {
            require(request.wordIds.size <= 100) { "At most 100 exact words may be selected" }
            exact += queryWords("w.id IN (:wordIds)", mapOf("wordIds" to request.wordIds, "profileId" to profileId))
        }
        if(request.personalWordIds.isNotEmpty()){
            require(request.personalWordIds.size<=100){"At most 100 personal words may be selected"}
            exact += jdbc.sql("SELECT id,german,english FROM personal_words WHERE profile_id=:owner AND id IN (:ids) AND deleted_at IS NULL")
                .param("owner",profileId).param("ids",request.personalWordIds)
                .query{rs,_->WordCandidate(rs.getObject("id",UUID::class.java),"PERSONAL",rs.getString("german"),rs.getString("english"),emptyList())}.list()
        }
        if (request.categoryIds.isNotEmpty()) {
            exact += queryWords(
                "w.deleted_at IS NULL AND EXISTS (SELECT 1 FROM word_categories wc WHERE wc.word_id=w.id AND wc.category_id IN (:categoryIds))",
                mapOf("categoryIds" to request.categoryIds, "profileId" to profileId),
            )
        }
        if(exact.isNotEmpty())return exact.distinctBy{it.source to it.id}
        val clauses = mutableListOf("w.deleted_at IS NULL")
        val params = mutableMapOf<String, Any>("profileId" to profileId)
        if (request.unseenOnly) clauses += "(up.id IS NULL OR up.state='UNSEEN')"
        return queryWords(clauses.joinToString(" AND "), params)
    }

    private fun queryWords(condition: String, params: Map<String, Any>): List<WordCandidate> {
        var query = jdbc.sql(
            """SELECT w.id,w.german,w.english,w.present_form,w.preterite_form,w.perfect_form
               FROM words w
               LEFT JOIN user_progress up ON up.profile_id=:profileId AND up.word_id=w.id
               WHERE $condition
               ORDER BY CASE
                   WHEN up.next_review_at <= now() THEN 0
                   WHEN up.id IS NULL OR up.state='UNSEEN' THEN 1
                   ELSE 2
               END, up.next_review_at NULLS FIRST, random()
               LIMIT 500"""
        )
        params.forEach { (key, value) -> query = query.param(key, value) }
        return query.query { rs, _ -> WordCandidate(rs.getObject("id", UUID::class.java), "GLOBAL", rs.getString("german"), rs.getString("english"),
            listOfNotNull(rs.getString("present_form"), rs.getString("preterite_form"), rs.getString("perfect_form"))) }.list()
    }

    private fun createSession(profileId: UUID, rootId: UUID?, type: SessionType, direction: Direction, ordering: Ordering, words: List<WordCandidate>): GameSessionView {
        require(words.map { it.source to it.id }.distinct().size == words.size) { "A deck cannot contain duplicate words" }
        val id = UUID.randomUUID()
        jdbc.sql("INSERT INTO game_sessions(id,profile_id,root_session_id,session_type,status,direction,ordering) VALUES(:id,:profileId,:rootId,:type,'ACTIVE',:direction,:ordering)")
            .param("id", id).param("profileId", profileId).param("rootId", rootId).param("type", type.name)
            .param("direction", direction.name).param("ordering", ordering.name).update()
        words.forEachIndexed { index, word ->
            jdbc.sql("""INSERT INTO game_session_cards(id,game_session_id,word_id,personal_word_id,position,german_snapshot,english_snapshot,present_form_snapshot,preterite_form_snapshot,perfect_form_snapshot)
                VALUES(:id,:sessionId,:wordId,:personalWordId,:position,:german,:english,:present,:preterite,:perfect)""")
                .param("id", UUID.randomUUID()).param("sessionId", id)
                .param("wordId",if(word.source=="GLOBAL")word.id else null,java.sql.Types.OTHER)
                .param("personalWordId",if(word.source=="PERSONAL")word.id else null,java.sql.Types.OTHER).param("position", index)
                .param("german", word.german).param("english", word.english)
                .param("present", word.forms.getOrNull(0), java.sql.Types.VARCHAR)
                .param("preterite", word.forms.getOrNull(1), java.sql.Types.VARCHAR)
                .param("perfect", word.forms.getOrNull(2), java.sql.Types.VARCHAR).update()
        }
        outbox("GameStarted", id, profileId)
        return get(profileId, id)
    }

    private fun sessionWords(sessionId: UUID, extraCondition: String): List<WordCandidate> = jdbc.sql(
        """SELECT c.word_id,c.personal_word_id,c.german_snapshot,c.english_snapshot,w.present_form,w.preterite_form,w.perfect_form
           FROM game_session_cards c LEFT JOIN words w ON w.id=c.word_id
           WHERE c.game_session_id=:sessionId $extraCondition ORDER BY c.position"""
    ).param("sessionId", sessionId).query { rs, _ ->
        val globalId=rs.getObject("word_id",UUID::class.java);val personalId=rs.getObject("personal_word_id",UUID::class.java)
        WordCandidate(globalId?:personalId,if(globalId!=null)"GLOBAL" else "PERSONAL",rs.getString("german_snapshot"), rs.getString("english_snapshot"),
        listOfNotNull(rs.getString("present_form"), rs.getString("preterite_form"), rs.getString("perfect_form"))) }.list()

    private fun ownedSession(profileId: UUID, sessionId: UUID): SessionRow = jdbc.sql(
        "SELECT id,profile_id,root_session_id,session_type,status,direction,ordering,updated_at FROM game_sessions WHERE id=:id AND profile_id=:profileId"
    ).param("id", sessionId).param("profileId", profileId).query { rs, _ -> SessionRow(
        rs.getObject("id", UUID::class.java), rs.getObject("profile_id", UUID::class.java),
        rs.getObject("root_session_id", UUID::class.java), SessionType.valueOf(rs.getString("session_type")),
        rs.getString("status"), Direction.valueOf(rs.getString("direction")), Ordering.valueOf(rs.getString("ordering")),
        rs.getTimestamp("updated_at").toInstant()) }.optional().orElseThrow { NotFoundException("Game not found") }

    private fun outbox(type: String, aggregateId: UUID, profileId: UUID) {
        val correlation = runCatching { UUID.fromString(MDC.get("correlation_id")) }.getOrElse { UUID.randomUUID() }
        jdbc.sql("""INSERT INTO outbox_events(event_id,event_type,event_version,aggregate_id,user_id,occurred_at,correlation_id,payload)
                    VALUES(:id,:type,1,:aggregateId,:profileId,now(),:correlation,jsonb_build_object('session_id',:aggregateId,'profile_id',:profileId))""")
            .param("id", UUID.randomUUID()).param("type", type).param("aggregateId", aggregateId)
            .param("profileId", profileId).param("correlation", correlation).update()
    }
}

private data class ProgressSource(
    val globalWordId: UUID?,
    val personalWordId: UUID?,
    val consecutiveKnown: Int,
)
