# Web security and connected systems

## Treat endpoints as production boundaries

For forms, webhooks, server functions, and auth routes inspect:

- authentication and provider signature verification;
- authorization and organization/tenant scope;
- method semantics and idempotency;
- input schema and size limits;
- CSRF, origin, CORS, cookie, and credential behavior;
- secret and PII logging;
- safe public errors and redacted diagnostic causes;
- rate limiting, replay, retry, and abuse behavior.

Never alias a mutating POST handler to GET. Never log complete environment
objects, provider keys, cookies, raw contact submissions, or message bodies.

## Auth binding

Base URL, base path, issuer, handler mount, discovery endpoints, cookie scope,
trusted origins, credentialed fetch, server framework plugin, and browser client
plugin form one contract. Authentication does not prove authorization.

## Connected-system verification

A UI can render correctly while auth, CORS, cookies, OpenAPI generation, CMS
cache, or server adapters fail. Run representative browser requests through the
deployed routing boundary, including failure and cross-origin cases where
claimed.
