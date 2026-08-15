package de.woertersee.api.feedback
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID
enum class FeedbackType{GENERAL,WORD_REPORT,TECHNICAL,FEATURE}
enum class FeedbackStatus{OPEN,IN_REVIEW,RESOLVED,REJECTED}
data class FeedbackRequest(val type:FeedbackType,@field:NotBlank @field:Size(max=160) val subject:String,@field:NotBlank @field:Size(max=4000) val message:String,val wordId:UUID?=null)
data class FeedbackView(val id:UUID,val type:FeedbackType,val subject:String,val message:String,val wordId:UUID?,val status:FeedbackStatus,val adminNote:String?,val createdAt:Instant)
data class AdminFeedbackUpdate(val status:FeedbackStatus,@field:Size(max=4000) val adminNote:String?=null)

