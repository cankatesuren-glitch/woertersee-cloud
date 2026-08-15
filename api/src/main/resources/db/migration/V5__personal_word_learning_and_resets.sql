ALTER TABLE game_session_cards ALTER COLUMN word_id DROP NOT NULL;
ALTER TABLE game_session_cards ADD COLUMN personal_word_id UUID REFERENCES personal_words(id);
ALTER TABLE game_session_cards ADD CONSTRAINT ck_card_word_source CHECK ((word_id IS NOT NULL) <> (personal_word_id IS NOT NULL));
CREATE UNIQUE INDEX uq_session_personal_word ON game_session_cards(game_session_id,personal_word_id) WHERE personal_word_id IS NOT NULL;

CREATE TABLE personal_word_progress (
 id UUID PRIMARY KEY, profile_id UUID NOT NULL REFERENCES profiles(id), personal_word_id UUID NOT NULL REFERENCES personal_words(id),
 state VARCHAR(20) NOT NULL DEFAULT 'UNSEEN', total_attempts INTEGER NOT NULL DEFAULT 0, known_attempts INTEGER NOT NULL DEFAULT 0,
 last_played_at TIMESTAMPTZ, version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT uq_personal_progress_word UNIQUE(profile_id,personal_word_id)
);
CREATE INDEX idx_personal_progress_state ON personal_word_progress(profile_id,state,last_played_at);
