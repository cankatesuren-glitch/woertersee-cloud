# Local development

## Prerequisites

- Java 21
- Node.js 22
- Docker with Compose

Run infrastructure and applications with `docker compose up --build`. Legacy vocabulary is enabled in Compose and imported transactionally on API startup.

For focused development, start PostgreSQL and Keycloak first, then run `./gradlew bootRun` in `api` and `npm run dev` in `web`. Copy `web/.env.example` to `web/.env.local` and replace `AUTH_SECRET` with a locally generated random value.

## Gameplay API

- `POST /api/v1/games` creates an exact-word or filtered game.
- `GET /api/v1/games/{id}` resumes it on another device.
- `PUT /api/v1/games/{id}/cards/{cardId}/answer` requires `Idempotency-Key`.
- `POST /api/v1/games/{id}/finish` scores answered cards only.
- `POST /api/v1/games/{id}/review` selects difficult cards from the root deck.
- `POST /api/v1/games/{id}/replay` recreates the immutable root deck.

All gameplay endpoints require a valid OIDC access token.

## Local sign-in

Keycloak is available at `http://localhost:8081`. The imported development-only learner is `demo` with password `local-demo-only`. These credentials and client secrets are intentionally scoped to the disposable local realm and must never be reused outside local development.

The disposable admin account is `admin` with password `local-admin-only`. It has both `USER` and `ADMIN` realm roles and exists only to exercise the local administration flow.
