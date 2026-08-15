package de.woertersee.api.vocabulary

import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.sql.Types
import java.util.UUID

data class LegacySeed(val version: Int, val categories: List<String>, val words: List<LegacySeedWord>)
data class LegacySeedWord(
    val german: String, val english: String, val categories: List<String>,
    val presentForm: String?, val preteriteForm: String?, val perfectForm: String?
)

@Component
@ConditionalOnProperty(name = ["woertersee.seed.legacy"], havingValue = "true")
class LegacySeedImporter(private val jdbc: JdbcClient, private val mapper: ObjectMapper) : ApplicationRunner {
    @Transactional
    override fun run(args: ApplicationArguments) {
        val seed = ClassPathResource("seed/legacy-vocabulary.json").inputStream.use { mapper.readValue(it, LegacySeed::class.java) }
        seed.categories.forEachIndexed { index, name ->
            jdbc.sql("""INSERT INTO categories(id,slug,name,type,sort_order) VALUES(:id,:slug,:name,:type,:sortOrder)
                        ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name, updated_at=now()""")
                .param("id", UUID.randomUUID()).param("slug", slug(name)).param("name", name)
                .param("type", if (name.startsWith("Kapitel ")) "CHAPTER" else "SYSTEM")
                .param("sortOrder", index).update()
        }
        seed.words.forEach { word ->
            val wordId = jdbc.sql("""INSERT INTO words(id,german,english,normalized_german,present_form,preterite_form,perfect_form)
                VALUES(:id,:german,:english,:normalized,:present,:preterite,:perfect)
                ON CONFLICT(normalized_german,english) DO UPDATE SET german=EXCLUDED.german,present_form=EXCLUDED.present_form,
                  preterite_form=EXCLUDED.preterite_form,perfect_form=EXCLUDED.perfect_form,updated_at=now()
                RETURNING id""")
                .param("id", UUID.randomUUID()).param("german", word.german).param("english", word.english)
                .param("normalized", word.german.lowercase())
                .param("present", word.presentForm, Types.VARCHAR)
                .param("preterite", word.preteriteForm, Types.VARCHAR)
                .param("perfect", word.perfectForm, Types.VARCHAR)
                .query(UUID::class.java).single()
            word.categories.forEach { category ->
                jdbc.sql("""INSERT INTO word_categories(word_id,category_id)
                    SELECT :wordId,id FROM categories WHERE slug=:slug ON CONFLICT DO NOTHING""")
                    .param("wordId", wordId).param("slug", slug(category)).update()
            }
        }
    }

    private fun slug(value: String) = value.lowercase().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
        .replace("ß", "ss").replace(Regex("[^a-z0-9]+"), "-").trim('-')
}
