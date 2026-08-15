CREATE INDEX idx_audit_created ON audit_logs(created_at DESC, id DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_profile_id, created_at DESC);
