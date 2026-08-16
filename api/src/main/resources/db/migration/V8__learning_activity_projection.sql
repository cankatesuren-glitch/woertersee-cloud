CREATE TABLE learning_activity_daily (
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    games_started INTEGER NOT NULL DEFAULT 0,
    games_completed INTEGER NOT NULL DEFAULT 0,
    last_event_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (profile_id, activity_date),
    CONSTRAINT chk_learning_activity_counts
        CHECK (games_started >= 0 AND games_completed >= 0)
);

CREATE INDEX idx_learning_activity_recent
    ON learning_activity_daily(profile_id, activity_date DESC);
