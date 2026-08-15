package de.woertersee.api.personalwords
import org.apache.commons.csv.CSVFormat
import kotlin.test.Test
import kotlin.test.assertEquals
class PersonalWordCsvTest{
 @Test fun `quoted commas remain inside one field`(){val csv="german,english,category\n\"sich freuen, wenn\",\"to be happy, when\",Kapitel 1\n";val row=CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).get().parse(csv.reader()).first();assertEquals("sich freuen, wenn",row.get("german"));assertEquals("to be happy, when",row.get("english"))}
}
