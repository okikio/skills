---
name: build-apis
description: Design, implement, refactor, review, diagnose, or verify HTTP APIs and service modules. Use for endpoint definitions, handlers, Hono composition, Standard Schema or Zod validation, stable response and problem contracts, middleware order, authentication, organization/resource authorization, Better Auth, pagination, query specifications, OpenAPI, observability, streaming, deployment resources, and executable request tests. Do not use for an incidental fetch call with no API contract change.
---

# Build APIs and service modules

This skill owns the transport-to-domain contract and service composition of an
HTTP API. A route is not complete because a schema and handler file exist. It
must be registered, reachable through the real middleware stack, authorized,
connected to its resource owner, represented accurately in generated contracts,
and exercised through an executable request.

`deliver-software` owns the overall change and final verdict.
`explore-ecosystems` owns dependency topology. `build-data` owns database/query
semantics. `build-workflows` owns durable background execution. Keep those
owners distinct.

## Outcome

Trace every material endpoint through one concrete path:

```text
method + route
    |
    v
registration
    |
    v
middleware order
    |
    v
request validation
    |
    v
authentication -> authorization
    |
    v
domain capability
    |
    +--> database/query
    +--> workflow
    +--> provider
    |
    v
response/problem mapping
    |
    v
OpenAPI + executable request tests
```

Any missing link is an unresolved contract, not an invitation to invent one.

## Evidence inventory

Locate:

- endpoint definitions and route registration;
- handler modules, groups/service registries, and the one service composition
  root for the deployment;
- validator middleware, Zod/Standard Schema contracts, codecs/coercion, and
  response/problem schemas;
- middleware order, CORS/CSRF, tracing, logging, error mapping, timeouts, and
  cancellation;
- auth/session construction, cookies, organization policy, and resource-level
  authorization filters;
- query/filter/sort/field/pagination contracts and database adapters;
- streaming/SSE routes, event identity, replay/cursor behavior, and slow-client
  policy;
- long-lived pools, clients, logger configuration, workflow runtimes, and their
  startup/shutdown ownership;
- generated OpenAPI, SDK/client artifacts if any, deployment health/readiness,
  and executable integration tests.

Separate architecture documentation from instantiated services. A guide or
workspace glob can describe a desired service-module pattern while no reachable
route actually implements it.

## Contract rules

1. **Schema-first project data.** Zod schema constants end in `Schema`;
   project-owned schema-derived data types normally end in `Type`; behavior
   interfaces/classes use the concrete domain noun. Do not maintain a second
   hand-written record interface for a schema-owned shape. Use Standard Schema
   when validator-neutral interop is genuinely required.
2. **Document schema fields where the authoring contract lives.** Important
   meaning, units, defaults, examples, security implications, and optionality
   belong on the schema fields so editor/tooling users see the contract.
3. **Validate at the owning layer.** Parse hostile transport input before domain
   code. Keep domain semantic validation distinct from parser/coercion rules.
   Never read `c.req.valid(...)` before matching validator middleware executed.
4. **Responses are complete contracts.** Define status, headers, body, empty
   success, pagination metadata, and problem/error variants. Do not model only
   the happy payload.
5. **Authenticate before authorizing.** Identity does not imply organization or
   record permission. Apply server-owned tenant/resource policy to the actual
   query/mutation, not only a UI or client filter.
6. **Use stable safe problems.** Public failures get stable codes/statuses and
   safe messages. Preserve structured causes for diagnostics under route-specific
   redaction. Do not leak provider/database exceptions.
7. **Own resources at the composition root.** Pools, auth clients, workflow
   runtimes, long-lived HTTP clients, and application LogTape configuration are
   not rebuilt per request and are closed/drained deliberately.
8. **Effect is conditional.** If the repository selected Effect, keep services,
   Layers, typed errors, Scope/finalizers, and request runtime composition
   coherent. Do not add Effect merely because this skill has an Effect reference.
9. **Unavailable behavior is explicit.** Do not expose a stub route that returns
   an empty 200/204. Unregister it or return an explicit unavailable contract
   until the capability exists.
10. **OpenAPI follows reachable reality.** Generated docs must represent the
    route/middleware/response surface actually mounted. A schema file is not
    evidence of reachability.
11. **Document internal ordering/lifecycle invariants.** Middleware ordering,
    auth policy composition, query constraints, SSE replay rules, resource
    factories, and error mapping often deserve comments/TSDoc even when private.

## Query and collection rules

For list endpoints, make these explicit:

- server-owned base filters and tenant/resource constraints;
- supported filter operators and normalization;
- stable sort including a deterministic tie-breaker;
- field selection and what cannot be selected;
- cursor or offset semantics;
- count strategy and cost;
- maximum page size and protection against unbounded work;
- cache behavior and authorization scope;
- OpenAPI representation and invalid-query response.

Do not translate a generic client query language directly into unrestricted SQL.

## Streaming rules

For SSE or other long-lived HTTP streams, define:

- durable or ephemeral event authority;
- event ID and resume cursor semantics;
- ordering and duplicate expectations;
- heartbeat/proxy behavior;
- per-client buffering and slow-consumer policy;
- authorization during connection lifetime;
- cancellation when the client disconnects;
- resource cleanup and deployment drain behavior.

A live in-memory event bus is not a replay source unless the contract explicitly
accepts non-durable history.

## Failure review

Test or inspect:

- route defined but never registered;
- middleware in the wrong order;
- invalid/coerced input bypassing schema validation;
- cross-tenant enumeration or IDOR;
- stale session/cookie/organization state;
- provider/database error disclosure;
- wildcard CORS added as a workaround;
- request timeout that does not cancel downstream work;
- request-scope resource leak;
- streaming client disconnect that leaves producers running;
- query sorting/cursor instability;
- OpenAPI success shape that differs from runtime;
- service readiness reporting healthy before dependencies are usable;
- shutdown that drops accepted work or leaks pools.

## Verification ladder

1. schema and pure contract tests;
2. middleware/order and handler unit tests where useful;
3. real request tests through the composed service;
4. malformed input and every documented problem class;
5. auth, organization, and resource authorization tests;
6. provider/database failure and cancellation tests;
7. streaming reconnect/slow-client/disconnect tests when applicable;
8. generated OpenAPI comparison against reachable routes;
9. startup/readiness/shutdown checks for deployment claims.

## Reference routing

- [service-modules.md](references/service-modules.md): definition/handler split,
  grouping, service registries, composition roots, reachability, and deployment.
- [contracts.md](references/contracts.md): Standard Schema, Zod, request
  sources, normalization, responses, problems, OpenAPI, and evolution.
- [effect-services.md](references/effect-services.md): Effect services,
  `Context.Tag`, Layers, typed errors, Scope, configuration, observability, and
  Hono/request-runtime composition.
- [auth.md](references/auth.md): Better Auth, sessions, plugins, cookies,
  organization/resource policy, routes, and operational flows.
- [queries.md](references/queries.md): filters, sorts, fields, pagination,
  counts, authorization constraints, and query construction.
- [runtime.md](references/runtime.md): HTTP adapters, middleware order,
  resources, LogTape, timeouts, errors, security, and shutdown.
- [streaming.md](references/streaming.md): SSE framing, cursors, replay,
  backpressure, cancellation, authorization, and durable source decisions.
- [deployment.md](references/deployment.md): configuration/resource ownership,
  health, readiness, independent deployment, draining, and contract tests.
- [failures.md](references/failures.md): failure signatures, evidence ladder,
  fault injection, and recovery.

## Completion gate

Do not call API work complete until the intended route is registered and
reachable, invalid and unauthorized requests fail correctly, resource lifetime
is proven, documented responses match executable behavior, generated API
artifacts agree with the mounted service, and deployment/streaming behavior has
been tested where claimed. Report unrun external-provider or deployment gates
explicitly.
