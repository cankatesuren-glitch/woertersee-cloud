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
