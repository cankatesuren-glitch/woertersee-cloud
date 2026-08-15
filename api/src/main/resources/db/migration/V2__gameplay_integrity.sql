CREATE TABLE answer_attempts (
    id UUID PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id),
    card_id UUID NOT NULL REFERENCES game_session_cards(id),
    profile_id UUID NOT NULL REFERENCES profiles(id),
    result VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_answer_idempotency UNIQUE (profile_id, idempotency_key),
    CONSTRAINT uq_card_answer UNIQUE (card_id)
);

CREATE INDEX idx_session_cards_order ON game_session_cards(game_session_id, position);
CREATE INDEX idx_attempts_profile_time ON answer_attempts(profile_id, answered_at DESC);

ALTER TABLE game_sessions
    ADD CONSTRAINT ck_game_session_type CHECK (session_type IN ('ORIGINAL', 'REVIEW', 'REPLAY')),
    ADD CONSTRAINT ck_game_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'ABANDONED')),
    ADD CONSTRAINT ck_game_direction CHECK (direction IN ('DE_EN', 'EN_DE')),
    ADD CONSTRAINT ck_game_ordering CHECK (ordering IN ('RANDOM', 'AZ'));

ALTER TABLE game_session_cards
    ADD CONSTRAINT ck_card_result CHECK (result IS NULL OR result IN ('KNOWN', 'DIFFICULT'));

