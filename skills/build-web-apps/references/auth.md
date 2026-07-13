# Better Auth in web applications

## One mounted contract

Align base URL, base path, issuer, wildcard handler, discovery and metadata
paths, consent route, cookie scope, trusted origins, credentials, and framework
integration. Test both root and mounted paths the application supports.

## Plugin symmetry

When server plugins require browser companions, configure and verify the paired
client plugins. Organization, passkey, OAuth provider, and framework cookie
integrations can have distinct server and client packages. Inspect the actual
Solid/TanStack bindings.

## Authorization

Authentication establishes identity. It does not establish access to the active
organization or requested record. Resolve organization context deliberately and
enforce server-side policy or base filters on every protected query.

Distinguish user-only scopes from organization-bound scopes. Do not trust an
organization identifier from URL or browser state without membership and policy
checks.

## Construction and data

Keep module imports environment-safe. Construct auth and database resources at
an explicit composition root and share long-lived instances. Align Better Auth's
schema, Drizzle adapter, generated migrations, and application database instance.

Do not require email verification until sender, confirmation, expiry, resend,
and failure workflows exist. Test cookies, logout/revocation, session expiry,
cross-tab behavior, and database/provider failures.
