# ADR-0002: Deliver the web product before the mobile client

Status: Accepted

## Context

WörterSee needs to serve desktop and mobile learners without maintaining two incomplete products or allowing client behavior to diverge. The backend and learning model are still evolving, so starting native development now would multiply contract and product changes.

## Decision

Complete the responsive, installable web application and stabilize its API contracts before building a native mobile client. The later mobile application will use React Native with Expo and will consume the same versioned REST API and OIDC provider.

## Consequences

The web release provides the quickest path to real usage and validates product behavior before a second client is introduced. Mobile development starts with clearer contracts and a proven learning flow.

The trade-off is that native capabilities such as secure offline study, push notifications and store distribution arrive later. The web application must therefore be genuinely usable on phones rather than treating mobile layout as a future concern.

