# Security

Authentication uses OAuth 2.0 Authorization Code flow through OpenID Connect. Keycloak is the disposable local provider; production providers are selected through issuer and JWK configuration.

Spring Security maps Keycloak realm roles to `ROLE_USER` and `ROLE_ADMIN`. `/api/v1/admin/**` is protected server-side with `ADMIN`; hiding UI controls is never treated as authorization. Every personal-word query includes the authenticated profile id, preventing object-level access across users.

Personal-word updates require an `If-Match` version. Deletes are soft deletes, and a partial unique index permits a user to add a previously deleted word again without exposing old content.

Personal-word deck selection filters every requested id by the authenticated profile. Progress reset operations require explicit confirmation and write an audit record in the same transaction.

Development credentials under `keycloak/` are disposable local values and must not be reused. Production secrets belong in a secret manager.
