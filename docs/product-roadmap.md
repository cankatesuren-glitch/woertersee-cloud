# Product roadmap

WörterSee is developed as a web product first and a mobile product second. Both clients use the same authenticated backend APIs and learning model.

## Stage 1 — Web foundation

The first release target is a responsive, installable PWA. It must work well with keyboard, touch and narrow screens before mobile development starts.

Exit criteria:

- quick play, deck builder and exact-word selection are complete;
- active games resume across browsers and devices;
- personal words, CSV workflows, feedback and administration are usable;
- authentication, authorization and account recovery are production-ready;
- accessibility checks cover keyboard navigation, focus, contrast and screen-reader labels;
- browser smoke tests cover the primary learning journey;
- the web app has a manifest, service worker and a documented offline policy;
- REST contracts used by clients are versioned and covered by contract tests.

## Stage 2 — Web reliability and deployment

Before introducing a second client, the web product establishes the operational baseline:

- Kafka outbox delivery and idempotent analytics consumers;
- Redis-backed rate limiting and carefully scoped caching;
- OpenTelemetry traces, metrics, structured logs and dashboards;
- load tests and a published performance report;
- preview, staging and production environments;
- backup, restore, incident and rollback procedures.

## Stage 3 — Mobile application

The initial mobile client should use React Native with Expo and TypeScript. This keeps client-side language and component knowledge close to the Next.js application while still producing native iOS and Android packages.

The mobile app is a separate workspace package, not a WebView wrapper. It consumes the same OpenAPI-generated client and OIDC provider as the web application.

Initial mobile scope:

- sign in with Authorization Code and PKCE;
- quick play, deck builder and exact-word selection;
- card answering, early finish, review and replay;
- personal-word management;
- progress dashboard and active-game resume;
- local encrypted token storage;
- cached read models and an explicit offline/retry state;
- deep links for shared decks or future study plans;
- push notifications only after the reminder model is defined.

Mobile release work also includes App Store and Play Store signing, privacy disclosures, accessibility review, crash reporting and a staged rollout. These concerns are intentionally deferred until the web API and product behavior are stable.

## Shared client architecture

Code may be shared only where the abstraction remains natural:

- generated OpenAPI types and API client;
- validation schemas and domain terminology;
- design tokens such as colour, spacing and typography roles;
- analytics event names;
- pure learning calculations.

Web and mobile keep their own navigation, accessibility primitives and presentation components. A forced universal component library would hide platform differences and make both products harder to maintain.

## Delivery order from the current state

1. Complete global vocabulary and category administration.
2. Add audit-log browsing and finish the web administration workflow.
3. Complete deck builder, exact-word picker and progress dashboard.
4. Add PWA installation, accessibility and browser journey tests.
5. Stabilize OpenAPI contracts and generate a TypeScript client.
6. Complete event-driven analytics and production infrastructure.
7. Scaffold the Expo mobile workspace and implement the first native learning flow.

