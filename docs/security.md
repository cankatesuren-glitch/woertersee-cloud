# Security

Authentication uses OAuth 2.0 Authorization Code flow through OpenID Connect. Keycloak is the disposable local provider; production providers are selected through issuer and JWK configuration.

Spring Security maps Keycloak realm roles to `ROLE_USER` and `ROLE_ADMIN`. `/api/v1/admin/**` is protected server-side with `ADMIN`; hiding UI controls is never treated as authorization. Every personal-word query includes the authenticated profile id, preventing object-level access across users.

Global vocabulary and category mutations are exposed only below `/api/v1/admin`. Word updates require an `If-Match` version, duplicate database keys become conflict responses, deletion is soft, and each mutation writes an audit entry. A web-layer security test verifies that `ROLE_USER` receives HTTP 403 for administration endpoints.

Personal-word updates require an `If-Match` version. Deletes are soft deletes, and a partial unique index permits a user to add a previously deleted word again without exposing old content.

Personal-word deck selection filters every requested id by the authenticated profile. Progress reset operations require explicit confirmation and write an audit record in the same transaction.

Development credentials under `keycloak/` are disposable local values and must not be reused. Production secrets belong in a secret manager.

Admin audit records are available through `GET /api/v1/admin/audit-logs`. The endpoint is read-only, role-protected, paginated, and supports exact filters for action, target type, and actor profile. Correlation IDs connect an administrative change to the originating request without exposing access tokens or identity-provider claims.
