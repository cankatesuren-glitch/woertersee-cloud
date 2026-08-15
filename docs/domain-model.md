# Domain model

A game session owns immutable card snapshots. A review points to its root session and includes only incorrectly answered cards. Replays also derive from that root snapshot, so a review never loses the original deck relationship.

Database constraints enforce one card per word per session and one progress row per user and word.

Answer attempts have both a unique card constraint and an owner-scoped idempotency key. The API accepts a repeated identical request as success but rejects reuse of the same key for a different answer.

Personal words belong to exactly one profile. Every read and mutation is owner-scoped, updates use an optimistic version, and deletion is soft. A partial unique index prevents active duplicates while allowing a deleted word to be created again.

Game cards reference exactly one source: a global word or an owner-scoped personal word. Both are copied into immutable card snapshots. Personal-word answers update a separate owner-scoped progress table, while review and replay continue to derive from the original snapshot.

Feedback belongs to its submitting profile and moves through `OPEN`, `IN_REVIEW`, `RESOLVED` or `REJECTED`. Administrative state changes produce immutable audit entries.

Global words use optimistic versions and soft deletion. Their category relations are replaced transactionally after all supplied category ids have been validated. Word changes also create versioned `WordCorrected` outbox events.

Progress resets require an explicit confirmation flag, execute inside one transaction and record the reset type plus affected-row count in the audit log.
