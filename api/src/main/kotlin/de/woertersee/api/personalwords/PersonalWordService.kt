package de.woertersee.api.personalwords

import de.woertersee.api.platform.error.ConflictException
import de.woertersee.api.platform.error.NotFoundException
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVPrinter
import org.springframework.dao.DuplicateKeyException
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.StringWriter
import java.sql.Types
import java.util.UUID

@Service
class PersonalWordService(private val jdbc: JdbcClient) {
    fun list(owner: UUID): List<PersonalWordView> = jdbc.sql(
        """SELECT id,german,english,category,description,version,updated_at
           FROM personal_words WHERE profile_id=:owner AND deleted_at IS NULL ORDER BY updated_at DESC"""
    ).param("owner", owner).query(::map).list()

    fun categories(owner: UUID): List<PersonalCategorySummary> = jdbc.sql(
        """SELECT category AS name,count(*) AS word_count
           FROM personal_words
           WHERE profile_id=:owner AND deleted_at IS NULL
             AND category IS NOT NULL AND btrim(category)<>''
           GROUP BY category ORDER BY lower(category)"""
    ).param("owner",owner).query { rs, _ ->
        PersonalCategorySummary(rs.getString("name"),rs.getInt("word_count"))
    }.list()

    @Transactional
    fun create(owner: UUID, request: PersonalWordRequest): PersonalWordView {
        val id = UUID.randomUUID()
        try {
            jdbc.sql(
                """INSERT INTO personal_words(id,profile_id,german,english,normalized_german,category,description)
                   VALUES(:id,:owner,:de,:en,:normalized,:category,:description)"""
            ).param("id", id).param("owner", owner).param("de", request.german.trim())
                .param("en", request.english.trim()).param("normalized", normalize(request.german))
                .param("category", clean(request.category), Types.VARCHAR)
                .param("description", clean(request.description), Types.VARCHAR).update()
        } catch (exception: DuplicateKeyException) {
            throw ConflictException("This personal word already exists")
        }
        return get(owner, id)
    }

    @Transactional
    fun update(owner: UUID, id: UUID, request: PersonalWordRequest, expectedVersion: Long): PersonalWordView {
        val count = jdbc.sql(
            """UPDATE personal_words SET german=:de,english=:en,normalized_german=:normalized,
               category=:category,description=:description,version=version+1,updated_at=now()
               WHERE id=:id AND profile_id=:owner AND deleted_at IS NULL AND version=:version"""
        ).param("de", request.german.trim()).param("en", request.english.trim())
            .param("normalized", normalize(request.german)).param("category", clean(request.category), Types.VARCHAR)
            .param("description", clean(request.description), Types.VARCHAR).param("id", id).param("owner", owner)
            .param("version", expectedVersion).update()
        if (count == 0) throw ConflictException("Word changed or no longer exists")
        return get(owner, id)
    }

    @Transactional
    fun delete(owner: UUID, id: UUID) {
        if (jdbc.sql("UPDATE personal_words SET deleted_at=now(),updated_at=now(),version=version+1 WHERE id=:id AND profile_id=:owner AND deleted_at IS NULL")
                .param("id", id).param("owner", owner).update() == 0
        ) throw NotFoundException("Personal word not found")
    }

    fun preview(owner: UUID, csv: String): CsvPreview {
        val rows = parse(csv)
        val existing = list(owner).associateBy { "${normalize(it.german)}\u0000${it.english.lowercase()}" }
        val seen = mutableSetOf<String>()
        var added = 0; var updated = 0; var skipped = 0
        val previews = rows.mapIndexed { index, row ->
            val errors = mutableListOf<String>()
            if (row.german.isBlank()) errors += "German is required"
            if (row.english.isBlank()) errors += "English is required"
            if (row.german.length > 255 || row.english.length > 255) errors += "Word exceeds 255 characters"
            val key = "${normalize(row.german)}\u0000${row.english.lowercase()}"
            val status = when {
                errors.isNotEmpty() -> "INVALID"
                !seen.add(key) -> "DUPLICATE_IN_FILE"
                existing.containsKey(key) -> "UPDATE"
                else -> "ADD"
            }
            when (status) { "ADD" -> added++; "UPDATE" -> updated++; else -> skipped++ }
            CsvRowPreview(index + 2, row.german, row.english, row.category, status, errors)
        }
        return CsvPreview(previews.none { it.status == "INVALID" }, added, updated, skipped, previews)
    }

    @Transactional
    fun import(owner: UUID, csv: String): CsvPreview {
        val preview = preview(owner, csv)
        require(preview.valid) { "CSV contains invalid rows" }
        preview.rows.filter { it.status == "ADD" }.forEach { create(owner, PersonalWordRequest(it.german, it.english, it.category)) }
        preview.rows.filter { it.status == "UPDATE" }.forEach { row ->
            val current = jdbc.sql(
                """SELECT id,german,english,category,description,version,updated_at FROM personal_words
                   WHERE profile_id=:owner AND normalized_german=:de AND lower(english)=lower(:en) AND deleted_at IS NULL"""
            ).param("owner", owner).param("de", normalize(row.german)).param("en", row.english).query(::map).single()
            update(owner, current.id, PersonalWordRequest(row.german, row.english, row.category, current.description), current.version)
        }
        return preview
    }

    fun export(owner: UUID): String {
        val out = StringWriter()
        CSVPrinter(out, CSVFormat.DEFAULT.builder().setHeader("german", "english", "category").get()).use { printer ->
            list(owner).forEach { printer.printRecord(it.german, it.english, it.category ?: "") }
        }
        return out.toString()
    }

    private fun get(owner: UUID, id: UUID) = jdbc.sql(
        "SELECT id,german,english,category,description,version,updated_at FROM personal_words WHERE id=:id AND profile_id=:owner AND deleted_at IS NULL"
    ).param("owner", owner).param("id", id).query(::map).optional().orElseThrow { NotFoundException("Personal word not found") }

    private fun parse(csv: String): List<PersonalWordRequest> {
        val format = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreEmptyLines(true).setTrim(true).get()
        return format.parse(csv.reader()).map { PersonalWordRequest(it.get("german"), it.get("english"), it.toMap()["category"]?.takeIf(String::isNotBlank)) }
    }

    private fun map(rs: java.sql.ResultSet, row: Int) = PersonalWordView(
        rs.getObject("id", UUID::class.java), rs.getString("german"), rs.getString("english"),
        rs.getString("category"), rs.getString("description"), rs.getLong("version"), rs.getTimestamp("updated_at").toInstant()
    )

    private fun normalize(value: String) = value.trim().lowercase()
    private fun clean(value: String?) = value?.trim()?.takeIf(String::isNotBlank)
}
