CREATE TABLE roles (id UUID PRIMARY KEY, name VARCHAR(30) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE profile_roles (profile_id UUID NOT NULL REFERENCES profiles(id), role_id UUID NOT NULL REFERENCES roles(id), PRIMARY KEY(profile_id,role_id));
INSERT INTO roles(id,name) VALUES(gen_random_uuid(),'USER'),(gen_random_uuid(),'ADMIN') ON CONFLICT(name) DO NOTHING;

CREATE TABLE personal_words (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    german VARCHAR(255) NOT NULL,
    english VARCHAR(255) NOT NULL,
    normalized_german VARCHAR(255) NOT NULL,
    category VARCHAR(140),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_personal_word_active ON personal_words(profile_id,normalized_german,english) WHERE deleted_at IS NULL;
CREATE INDEX idx_personal_words_owner ON personal_words(profile_id,updated_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE feedback (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    word_id UUID REFERENCES words(id),
    type VARCHAR(30) NOT NULL,
    subject VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_feedback_type CHECK(type IN ('GENERAL','WORD_REPORT','TECHNICAL','FEATURE')),
    CONSTRAINT ck_feedback_status CHECK(status IN ('OPEN','IN_REVIEW','RESOLVED','REJECTED'))
);
CREATE INDEX idx_feedback_admin_queue ON feedback(status,created_at);
CREATE INDEX idx_feedback_owner ON feedback(profile_id,created_at DESC);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_profile_id UUID REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_target ON audit_logs(target_type,target_id,created_at DESC);
