# ADR-0001: Start with a modular monolith

Status: Accepted

## Decision

Deploy vocabulary, learning, feedback and administration as one API while enforcing package and persistence boundaries. Analytics is separated once event delivery is introduced.

## Consequences

The core game remains transactionally simple and inexpensive to operate. Modules may be extracted later when independent scaling, ownership or release cadence justifies distributed-system overhead.

