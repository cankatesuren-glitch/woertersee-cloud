# WörterSee Cloud

Production-minded German vocabulary learning platform built with Kotlin, Spring Boot, PostgreSQL and Next.js.

## Quick start

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8080
- API health: http://localhost:8080/actuator/health
- Keycloak: http://localhost:8081

Architecture and delivery decisions live in [`docs`](docs/architecture.md).

The disposable local learner account is `demo` / `local-demo-only`. Never reuse these local-only credentials in a deployed environment.

## Refresh legacy vocabulary

Clone the original application into `legacy-source`, then validate without writing:

```bash
npx --yes tsx tools/export-legacy-seed.ts --dry-run
```

Remove `--dry-run` to regenerate the versioned seed. The importer runs transactionally and uses database upserts, so restarts do not create duplicate words or category relations.
