package de.woertersee.api.progress
import org.slf4j.MDC
import org.springframework.jdbc.core.simple.JdbcClient
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.sql.Types
import java.util.UUID
enum class ResetType{UNSEEN_HISTORY,LEARNING_PROGRESS,ALL_PROGRESS}
data class ResetProgressRequest(val type:ResetType,val confirmed:Boolean=false)
data class ResetProgressResult(val type:ResetType,val affectedRecords:Int)
@Service class ProgressResetService(private val jdbc:JdbcClient){
 @Transactional fun reset(profileId:UUID,request:ResetProgressRequest):ResetProgressResult{
  require(request.confirmed){"Explicit confirmation is required"}
  val affected=when(request.type){
   ResetType.UNSEEN_HISTORY->jdbc.sql("UPDATE user_progress SET state='UNSEEN',updated_at=now(),version=version+1 WHERE profile_id=:id").param("id",profileId).update()+jdbc.sql("UPDATE personal_word_progress SET state='UNSEEN',updated_at=now(),version=version+1 WHERE profile_id=:id").param("id",profileId).update()
   ResetType.LEARNING_PROGRESS->jdbc.sql("DELETE FROM user_progress WHERE profile_id=:id").param("id",profileId).update()+jdbc.sql("DELETE FROM personal_word_progress WHERE profile_id=:id").param("id",profileId).update()
   ResetType.ALL_PROGRESS->{
    val sessionIds=jdbc.sql("SELECT id FROM game_sessions WHERE profile_id=:id").param("id",profileId).query(UUID::class.java).list()
    var count=jdbc.sql("DELETE FROM user_progress WHERE profile_id=:id").param("id",profileId).update()+jdbc.sql("DELETE FROM personal_word_progress WHERE profile_id=:id").param("id",profileId).update()
    if(sessionIds.isNotEmpty()){
     count+=jdbc.sql("DELETE FROM answer_attempts WHERE profile_id=:id").param("id",profileId).update()
     count+=jdbc.sql("DELETE FROM game_session_cards WHERE game_session_id IN (:ids)").param("ids",sessionIds).update()
     count+=jdbc.sql("DELETE FROM game_sessions WHERE profile_id=:id").param("id",profileId).update()
    };count
   }
  }
  val correlation=runCatching{UUID.fromString(MDC.get("correlation_id"))}.getOrNull()
  jdbc.sql("""INSERT INTO audit_logs(id,actor_profile_id,action,target_type,metadata,correlation_id)
    VALUES(:id,:actor,'PROGRESS_RESET','profile',jsonb_build_object('reset_type',:type,'affected_records',:affected),:correlation)""")
   .param("id",UUID.randomUUID()).param("actor",profileId).param("type",request.type.name).param("affected",affected).param("correlation",correlation,Types.OTHER).update()
  return ResetProgressResult(request.type,affected)
 }
}
