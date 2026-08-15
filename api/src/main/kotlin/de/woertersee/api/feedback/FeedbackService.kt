package de.woertersee.api.feedback
import de.woertersee.api.platform.error.NotFoundException
import org.slf4j.MDC
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.sql.Types
import java.util.UUID
@Service class FeedbackService(private val jdbc:JdbcClient){
 fun mine(owner:UUID)=jdbc.sql("SELECT id,type,subject,message,word_id,status,admin_note,created_at FROM feedback WHERE profile_id=:owner ORDER BY created_at DESC").param("owner",owner).query(::map).list()
 @Transactional fun submit(owner:UUID,request:FeedbackRequest):FeedbackView{if(request.type==FeedbackType.WORD_REPORT)require(request.wordId!=null){"wordId is required for a word report"};val id=UUID.randomUUID();jdbc.sql("INSERT INTO feedback(id,profile_id,word_id,type,subject,message) VALUES(:id,:owner,:wordId,:type,:subject,:message)").param("id",id).param("owner",owner).param("wordId",request.wordId,Types.OTHER).param("type",request.type.name).param("subject",request.subject.trim()).param("message",request.message.trim()).update();audit(owner,"FEEDBACK_SUBMITTED","feedback",id);return mine(owner).first{it.id==id}}
 fun adminQueue(status:FeedbackStatus?) :List<FeedbackView>{var query=jdbc.sql("SELECT id,type,subject,message,word_id,status,admin_note,created_at FROM feedback WHERE (:status IS NULL OR status=:status) ORDER BY created_at");query=query.param("status",status?.name,Types.VARCHAR);return query.query(::map).list()}
 @Transactional fun updateByAdmin(admin:UUID,id:UUID,request:AdminFeedbackUpdate):FeedbackView{if(jdbc.sql("UPDATE feedback SET status=:status,admin_note=:note,updated_at=now() WHERE id=:id").param("status",request.status.name).param("note",request.adminNote,Types.VARCHAR).param("id",id).update()==0)throw NotFoundException("Feedback not found");audit(admin,"FEEDBACK_REVIEWED","feedback",id);return adminQueue(null).first{it.id==id}}
 private fun audit(actor:UUID,action:String,target:String,id:UUID){val correlation=runCatching{UUID.fromString(MDC.get("correlation_id"))}.getOrNull();jdbc.sql("INSERT INTO audit_logs(id,actor_profile_id,action,target_type,target_id,correlation_id) VALUES(:id,:actor,:action,:target,:targetId,:correlation)").param("id",UUID.randomUUID()).param("actor",actor).param("action",action).param("target",target).param("targetId",id).param("correlation",correlation,Types.OTHER).update()}
 private fun map(rs:java.sql.ResultSet,row:Int)=FeedbackView(rs.getObject("id",UUID::class.java),FeedbackType.valueOf(rs.getString("type")),rs.getString("subject"),rs.getString("message"),rs.getObject("word_id",UUID::class.java),FeedbackStatus.valueOf(rs.getString("status")),rs.getString("admin_note"),rs.getTimestamp("created_at").toInstant())
}

