# Authentication and authorization

## Better Auth ecosystem

Inspect server core, database adapter, generated schema/migrations, session and
cookie behavior, plugins, paired client plugins, framework bindings, route mount,
base URL, trusted origins, and deployment host. Community adapters or plugins do
not gain first-party status through naming.

## Identity versus policy

Authentication identifies a user/session. Authorization decides whether that
identity can act on an organization, tenant, resource, scope, or operation.
Resolve active organization deliberately and enforce membership and policy at
the server boundary.

Apply server-owned base filters before user filters. Never trust an organization
ID from URL, body, or client state without policy validation.

## Plugin and route symmetry

Where Better Auth requires them, pair server plugins with browser client plugins
for organization, passkey, OAuth provider, or other capabilities. Align handler
wildcard, issuer, OIDC discovery, OAuth metadata, consent paths, base path, and
cookie scope. Test both root and mounted installations the app supports.

## Construction

Module import must not read required environment values, connect a database, or
configure global logging. Export factories and construct a shared long-lived
database/auth instance at an explicit composition root. Provide close/drain
behavior for tests, CLIs, workers, and graceful shutdown.

## Operational completeness

Do not require email verification before sender, confirmation, expiry, resend,
and failure workflows exist. Test session expiry/revocation, cookie security,
cross-origin requests, organization changes, provider failure, and database
failure.
