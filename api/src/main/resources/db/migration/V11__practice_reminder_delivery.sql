CREATE TABLE practice_reminder_deliveries (
    id UUID PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reminder_date DATE NOT NULL,
    local_time TIME NOT NULL,
    timezone VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_practice_reminder_delivery UNIQUE (profile_id, reminder_date)
);

CREATE INDEX idx_practice_reminder_delivery_profile
    ON practice_reminder_deliveries(profile_id, created_at DESC);
