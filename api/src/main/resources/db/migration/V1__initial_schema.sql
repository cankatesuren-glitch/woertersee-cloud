CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    issuer VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    display_name VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_profile_identity UNIQUE (issuer, subject)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(140) NOT NULL,
    type VARCHAR(30) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE words (
    id UUID PRIMARY KEY,
    german VARCHAR(255) NOT NULL,
    english VARCHAR(255) NOT NULL,
    normalized_german VARCHAR(255) NOT NULL,
    present_form VARCHAR(255),
    preterite_form VARCHAR(255),
    perfect_form VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_global_word UNIQUE (normalized_german, english)
);

CREATE TABLE word_categories (
    word_id UUID NOT NULL REFERENCES words(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    PRIMARY KEY (word_id, category_id)
);

CREATE TABLE game_sessions (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    root_session_id UUID REFERENCES game_sessions(id),
    session_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    ordering VARCHAR(10) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_session_cards (
    id UUID PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    word_id UUID NOT NULL REFERENCES words(id),
    position INTEGER NOT NULL,
    german_snapshot VARCHAR(255) NOT NULL,
    english_snapshot VARCHAR(255) NOT NULL,
    result VARCHAR(20),
    answered_at TIMESTAMPTZ,
    CONSTRAINT uq_session_word UNIQUE (game_session_id, word_id),
    CONSTRAINT uq_session_position UNIQUE (game_session_id, position)
);

CREATE TABLE user_progress (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    word_id UUID NOT NULL REFERENCES words(id),
    state VARCHAR(20) NOT NULL DEFAULT 'UNSEEN',
    total_attempts INTEGER NOT NULL DEFAULT 0,
    known_attempts INTEGER NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_progress_word UNIQUE (profile_id, word_id)
);

CREATE TABLE outbox_events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    aggregate_id UUID NOT NULL,
    user_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL,
    correlation_id UUID NOT NULL,
    causation_id UUID,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE TABLE processed_events (
    consumer_name VARCHAR(100) NOT NULL,
    event_id UUID NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer_name, event_id)
);

CREATE INDEX idx_words_normalized_german ON words(normalized_german) WHERE deleted_at IS NULL;
CREATE INDEX idx_progress_state ON user_progress(profile_id, state, last_played_at);
CREATE INDEX idx_active_sessions ON game_sessions(profile_id, status, updated_at);
CREATE INDEX idx_outbox_pending ON outbox_events(status, next_attempt_at) WHERE status = 'PENDING';

