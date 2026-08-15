package de.woertersee.api.personalwords

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class PersonalWordRequest(
    @field:NotBlank @field:Size(max=255) val german:String,
    @field:NotBlank @field:Size(max=255) val english:String,
    @field:Size(max=140) val category:String?=null
)
data class PersonalWordView(val id:UUID,val german:String,val english:String,val category:String?,val version:Long,val updatedAt:Instant)
data class CsvRowPreview(val row:Int,val german:String,val english:String,val category:String?,val status:String,val errors:List<String>)
data class CsvPreview(val valid:Boolean,val added:Int,val updated:Int,val skipped:Int,val rows:List<CsvRowPreview>)

