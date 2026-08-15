package de.woertersee.api.admin.vocabulary
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID
data class AdminWordRequest(@field:NotBlank @field:Size(max=255)val german:String,@field:NotBlank @field:Size(max=255)val english:String,val presentForm:String?=null,val preteriteForm:String?=null,val perfectForm:String?=null,val categoryIds:Set<UUID> = emptySet())
data class AdminWordView(val id:UUID,val german:String,val english:String,val presentForm:String?,val preteriteForm:String?,val perfectForm:String?,val version:Long,val categoryIds:Set<UUID>,val updatedAt:Instant)
data class CategoryRequest(@field:NotBlank @field:Size(max=140)val name:String,@field:NotBlank @field:Size(max=100)val slug:String,val type:String="SYSTEM",val sortOrder:Int=0)
data class CategoryView(val id:UUID,val name:String,val slug:String,val type:String,val sortOrder:Int,val updatedAt:Instant)

