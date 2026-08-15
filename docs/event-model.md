# Event model

Every event contains `event_id`, `event_type`, `event_version`, `aggregate_id`, `user_id`, `occurred_at`, `correlation_id`, `causation_id` and `payload`.

Breaking payload changes increment `event_version`. Consumers reject unsupported versions. Delivery is at least once; consumers provide effectively-once state transitions using `processed_events(consumer_name, event_id)`.

