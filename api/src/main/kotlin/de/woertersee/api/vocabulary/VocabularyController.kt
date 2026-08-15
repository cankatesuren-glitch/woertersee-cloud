package de.woertersee.api.vocabulary

import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

data class WordSummary(val id: UUID, val german: String, val english: String, val forms: List<String>)
data class CategorySummary(val id: UUID, val name: String, val slug: String, val wordCount: Int)

@RestController
@RequestMapping("/api/v1/vocabulary")
class VocabularyController(private val jdbc: JdbcClient) {
    @GetMapping("/categories")
    fun categories(): List<CategorySummary> = jdbc.sql(
        """SELECT c.id, c.name, c.slug, count(w.id) AS word_count
           FROM categories c
           LEFT JOIN word_categories wc ON wc.category_id = c.id
           LEFT JOIN words w ON w.id = wc.word_id AND w.deleted_at IS NULL
           WHERE c.deleted_at IS NULL
           GROUP BY c.id, c.name, c.slug, c.sort_order
           ORDER BY c.sort_order, c.name""",
    ).query { rs, _ ->
        CategorySummary(
            id = rs.getObject("id", UUID::class.java),
            name = rs.getString("name"),
            slug = rs.getString("slug"),
            wordCount = rs.getInt("word_count"),
        )
    }.list()

    @GetMapping("/words")
    fun search(@RequestParam(defaultValue = "") query: String): List<WordSummary> = jdbc.sql(
        """SELECT id, german, english, present_form, preterite_form, perfect_form
           FROM words WHERE deleted_at IS NULL
             AND (:query = '' OR normalized_german LIKE lower(:query) || '%' OR lower(english) LIKE '%' || lower(:query) || '%')
           ORDER BY normalized_german LIMIT 100"""
    ).param("query", query.trim()).query { rs, _ ->
        WordSummary(rs.getObject("id", UUID::class.java), rs.getString("german"), rs.getString("english"),
            listOfNotNull(rs.getString("present_form"), rs.getString("preterite_form"), rs.getString("perfect_form")))
    }.list()
}
