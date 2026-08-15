# Architecture

WörterSee starts as a modular monolith plus an independently deployable analytics worker. Vocabulary, learning, feedback, identity and administration own explicit boundaries inside the API. PostgreSQL is the system of record; Redis is an optional accelerator rather than a source of truth.

Events are written to an outbox in the same transaction as domain changes. The worker maintains analytics read models and deduplicates messages through a database uniqueness constraint.

## Runtime components

1. Next.js PWA
2. Kotlin/Spring Boot API
3. Kotlin analytics worker (phase 3)
4. PostgreSQL, Redis and Kafka-compatible Redpanda

