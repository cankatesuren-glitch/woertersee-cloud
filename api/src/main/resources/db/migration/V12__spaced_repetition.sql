ALTER TABLE user_progress
    ADD COLUMN consecutive_known INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN review_interval_minutes BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD CONSTRAINT ck_user_progress_consecutive_known CHECK (consecutive_known >= 0),
    ADD CONSTRAINT ck_user_progress_review_interval CHECK (review_interval_minutes >= 0);

ALTER TABLE personal_word_progress
    ADD COLUMN consecutive_known INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN review_interval_minutes BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD CONSTRAINT ck_personal_progress_consecutive_known CHECK (consecutive_known >= 0),
    ADD CONSTRAINT ck_personal_progress_review_interval CHECK (review_interval_minutes >= 0);

CREATE INDEX idx_progress_due
    ON user_progress(profile_id, next_review_at, word_id);

CREATE INDEX idx_personal_progress_due
    ON personal_word_progress(profile_id, next_review_at, personal_word_id);
