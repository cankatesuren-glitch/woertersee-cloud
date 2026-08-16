# WörterSee Cloud

Production-minded German vocabulary learning platform built with Kotlin, Spring Boot, PostgreSQL and Next.js.

## Quick start

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8080
- API health: http://localhost:8080/actuator/health
- OpenAPI: http://localhost:8080/v3/api-docs
- Swagger UI: http://localhost:8080/swagger-ui.html
- Keycloak: http://localhost:8081

Architecture and delivery decisions live in [`docs`](docs/architecture.md).

## API client contract

The web and future mobile clients share types generated from the live OpenAPI
contract. With the local API running, refresh the versioned contract and types:

```bash
cd web
npm run api:generate
```

CI runs the same generation against a clean Docker stack and fails when the
committed contract or TypeScript declarations drift from the API.

The product is delivered web-first, followed by a native mobile client after API stabilization. See the [product roadmap](docs/product-roadmap.md) and [ADR-0002](docs/adr/0002-web-first-mobile-client.md). Contributions use one focused branch and pull request per independent change.

The disposable local learner account is `demo` / `local-demo-only`. Never reuse these local-only credentials in a deployed environment.

## Refresh legacy vocabulary

Clone the original application into `legacy-source`, then validate without writing:

```bash
npx --yes tsx tools/export-legacy-seed.ts --dry-run
```

Remove `--dry-run` to regenerate the versioned seed. The importer runs transactionally and uses database upserts, so restarts do not create duplicate words or category relations.
