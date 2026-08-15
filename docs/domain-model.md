# Domain model

A game session owns immutable card snapshots. A review points to its root session and includes only incorrectly answered cards. Replays also derive from that root snapshot, so a review never loses the original deck relationship.

Database constraints enforce one card per word per session and one progress row per user and word.

Answer attempts have both a unique card constraint and an owner-scoped idempotency key. The API accepts a repeated identical request as success but rejects reuse of the same key for a different answer.

Personal words belong to exactly one profile. Every read and mutation is owner-scoped, updates use an optimistic version, and deletion is soft. A partial unique index prevents active duplicates while allowing a deleted word to be created again.

Feedback belongs to its submitting profile and moves through `OPEN`, `IN_REVIEW`, `RESOLVED` or `REJECTED`. Administrative state changes produce immutable audit entries.
