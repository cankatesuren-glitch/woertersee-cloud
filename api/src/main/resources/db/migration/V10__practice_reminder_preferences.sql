ALTER TABLE profiles
    ADD COLUMN practice_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN practice_reminder_time TIME NOT NULL DEFAULT '18:00',
    ADD COLUMN practice_reminder_timezone VARCHAR(80) NOT NULL DEFAULT 'Europe/Berlin';
