---
name: build-apis
description: Design, implement, refactor, review, diagnose, or verify HTTP APIs and service modules. Use for endpoint definitions, handlers, Hono composition, Standard Schema or Zod validation, stable response and problem contracts, middleware order, authentication and organization authorization, Better Auth, pagination, query specifications, OpenAPI, observability, runtime resources, and integration tests. Do not use for an incidental fetch call with no API contract change.
---

# Build APIs and service modules

When active, `deliver-software` owns request authority and completion and
`explore-ecosystems` owns dependency topology. Otherwise preserve those checks
locally. This skill owns transport-to-domain contracts and service composition.

## Evidence inventory

Locate endpoint definitions, handler modules, group/service aggregators, the one
service composition root, middleware registration, validators, response/problem
schemas, OpenAPI generation, auth/session policy, query adapters, persistence
clients, resource construction/cleanup, routes, and executable request tests.

Separate intended service-module documentation from instantiated services. A
workspace glob or guide can describe a target architecture while no service
package currently implements it.

## Procedure

1. Trace method and route from definition through registration, middleware,
   validation, handler, domain service, persistence, response mapping, OpenAPI,
   and request test.
2. Define runtime schemas and infer application types. Use Standard Schema only
   where validator-neutral interoperability is an actual boundary.
3. Separate endpoint contracts, service-domain capabilities, and resource
   implementations. If the repository selects Effect, construct its runtime once
   per deployment boundary. In every stack, do not rebuild long-lived pools,
   auth clients, log sinks, or equivalent resources per request.
4. Register matching validator middleware before reading `c.req.valid(...)`.
5. Describe full success and error response contracts, not payload-only shapes.
6. Authenticate identity, then authorize organization/tenant/resource access
   through server-owned policy and base filters.
7. Map errors to stable safe problems while preserving redacted structured causes
   in diagnostics. Never expose raw database/provider errors.
8. Own long-lived database/auth/logger resources at the composition root and
   expose close/drain behavior.
9. Reject silent stubs. Unavailable endpoints are unregistered or return an
   explicit unavailable/not-implemented contract, never an empty success.
10. Verify through real requests, invalid inputs, auth/org boundaries, database
    failures, concurrency, cancellation, and generated OpenAPI.

## Reference routing

- [service-modules.md](references/service-modules.md): definitions, handlers,
  aggregation, service registries, composition, reachability, and independent
  deployment boundaries.
- [contracts.md](references/contracts.md): Standard Schema, Zod, validation,
  responses, problems, and OpenAPI.
- [effect-services.md](references/effect-services.md): Effect services,
  `Context.Tag`, Layers, typed errors, Scope, configuration, observability, and
  request-runtime integration.
- [auth.md](references/auth.md): Better Auth, sessions, plugins, organization
  policy, routes, and import-safe construction.
- [queries.md](references/queries.md): filters, sorts, fields, pagination,
  count strategies, and server-owned constraints.
- [runtime.md](references/runtime.md): Hono adapters, middleware order,
  resources, LogTape, errors, and cleanup.
- [streaming.md](references/streaming.md): SSE framing, cursors, replay,
  backpressure, cancellation, authorization, and durable stream sources.
- [deployment.md](references/deployment.md): independent deployability,
  resource/config boundaries, health, readiness, shutdown, and contract tests.
- [failures.md](references/failures.md): source-grounded failure signatures and
  correction paths.

Completion requires a reachable route and executable request, not only a typed
definition or generated OpenAPI document.
