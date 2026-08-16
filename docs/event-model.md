# Event model

Every event contains `event_id`, `event_type`, `event_version`, `aggregate_id`, `user_id`, `occurred_at`, `correlation_id`, `causation_id` and `payload`.

Breaking payload changes increment `event_version`. Consumers reject unsupported versions. Delivery is at least once; consumers provide effectively-once state transitions using `processed_events(consumer_name, event_id)`.

## Outbox delivery

The API claims pending rows in small batches with PostgreSQL `FOR UPDATE SKIP
LOCKED`. A time-limited `PROCESSING` claim allows another instance to recover an
event when a publisher stops after claiming it.

Events are keyed by `aggregate_id` on `woertersee.domain-events.v1`, preserving
order for one aggregate. Kafka producer idempotence and `acks=all` protect the
producer session; delivery remains at least once across the Kafka/ database
boundary. Consumers must therefore commit `processed_events` in the same
transaction as their read-model update.

Failed publishes use capped exponential backoff. After eight attempts an event
moves to `DEAD` for operational review instead of retrying forever. Publisher
metrics expose successful, failed and dead deliveries.

## Learning activity consumer

The `learning-activity-v1` consumer builds a daily activity projection from
`GameStarted` and `GameCompleted` events. It records the event ID and projection
update in one database transaction, so replaying a message does not increment
the counters twice. Other version-one events are acknowledged without changing
the projection, allowing all domain events to share one ordered topic.

Invalid messages and unsupported event versions are retried twice and then sent
to `woertersee.domain-events.v1.dlt` with the source partition preserved. Events
for profiles removed under the data-deletion flow are acknowledged without
recreating a projection.

## Practice reminders

The reminder scheduler evaluates each enabled profile in its configured IANA
time zone. Once the local reminder time has passed, it creates one delivery row
for that learner and local date and writes a `PracticeReminderDue` event to the
outbox in the same transaction.

The unique `(profile_id, reminder_date)` constraint makes repeated scheduler
runs and concurrent API instances safe. Delivery providers consume the due
event; scheduling does not depend on a specific email or push vendor.
