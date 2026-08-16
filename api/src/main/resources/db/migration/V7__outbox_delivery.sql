ALTER TABLE outbox_events
    ADD COLUMN claimed_at TIMESTAMPTZ,
    ADD COLUMN last_error TEXT;

ALTER TABLE outbox_events
    ADD CONSTRAINT ck_outbox_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'DEAD'));

DROP INDEX idx_outbox_pending;
CREATE INDEX idx_outbox_delivery
    ON outbox_events(status, next_attempt_at, occurred_at)
    WHERE status IN ('PENDING', 'PROCESSING');
