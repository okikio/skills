# Service-module architecture

## Contents

- [Outcome](#outcome)
- [Terms and ownership](#terms-and-ownership)
- [Target module shape](#target-module-shape)
- [Definition and handler contract](#definition-and-handler-contract)
- [Group and service registries](#group-and-service-registries)
- [One composition root](#one-composition-root)
- [Domain and data seams](#domain-and-data-seams)
- [Workflow ownership](#workflow-ownership)
- [OpenAPI and reachability](#openapi-and-reachability)
- [Independent deployment](#independent-deployment)
- [Deliberate exclusions](#deliberate-exclusions)
- [Failure signatures](#failure-signatures)
- [Tests and verification](#tests-and-verification)
- [Evidence boundary](#evidence-boundary)

## Outcome

A service module is complete when a reviewer can find its public contracts,
middleware guarantees, behavior, domain capabilities, data access, resources,
registration, deployment entrypoint, and executable requests without reverse
engineering a generic framework. A file named `definition.ts` or a generated
OpenAPI operation is not implementation evidence by itself.

## Terms and ownership

| Term | Owns | Does not own |
|---|---|---|
| Service | One top-level runtime/deployment boundary such as accounts or ledger | Every related concept in the product |
| Service module | A coherent endpoint/domain slice inside a service | A separate server by default |
| Endpoint definition | Static transport contract and documentation | Business behavior or resource construction |
| Endpoint handler | Translation from validated transport input to a capability call | Database construction, global middleware, or workflow worker boot |
| Domain capability | Business operation and typed domain failures | Hono context or HTTP response tuples |
| Data adapter | Queries and persistence against an explicit client/transaction | Tenant authorization policy unless the policy is encoded as a required scope |
| Composition root | Configuration, resources, Layer graph, app construction, registration, shutdown | Domain policy |

Use “service module” consistently. A service is a top-level executable unit;
`accounts/preferences` can be a module within the `accounts` service. Do not
split a module into a network service solely because it has a folder.

## Target module shape

Start with the smallest shape that owns the current behavior:

```text
services/accounts/
├── endpoints/
│   └── preferences/
│       ├── get/
│       │   ├── definition.ts
│       │   └── handler.ts
│       ├── update/
│       │   ├── definition.ts
│       │   └── handler.ts
│       ├── mod.ts
│       └── index.ts
├── domain/
│   ├── preferences.ts
│   └── errors.ts
├── data/
│   └── preferences.ts
├── mod.ts
└── index.ts
```

Add durable-work folders only when the service owns durable behavior:

```text
services/imports/
├── endpoints/
├── workflows/
├── activities/
├── runtime/
├── domain/
├── data/
├── mod.ts
└── index.ts
```

- `endpoints/` owns HTTP, webhook, admin, status, signal, and cancellation
  adapters.
- `workflows/` owns replay-safe business coordination.
- `activities/` owns side effects called by workflows.
- `runtime/` owns engine adapters, registrations, and worker bootstrap.
- `domain/` owns business schemas, decisions, and typed errors.
- `data/` owns storage-specific queries and mappings.

Do not create an `orchestrator/` bucket. It obscures whether code is business
coordination, an engine adapter, a worker host, or ordinary domain behavior.

## Definition and handler contract

`definition.ts` should answer:

- stable endpoint name;
- method and relative route;
- schemas for every request source actually read;
- complete response variants;
- public description, operation identifier, tags, and security requirements;
- whether the route is synchronous or accepts durable work.

Prefer a definition helper that retains literal route and method types:

```ts
import { z } from "zod"

export const Params = z.object({ family_id: z.uuid() })
export const Json = z.object({ currency: z.string().length(3) })
export const Result = z.object({ family_id: z.uuid(), currency: z.string() })

export const Definition = defineEndpoint({
  name: "update-family-preferences",
  method: "PATCH",
  route: "/families/:family_id/preferences",
  schemas: { Param: Params, Json },
  responses: {
    200: jsonResponse(Result, "Preferences updated"),
    401: problemResponse("unauthorized"),
    403: problemResponse("forbidden"),
    404: problemResponse("family-not-found"),
    422: validationProblemResponse,
  },
  security: [{ session: [] }],
})
```

The exact helper names are repository-specific. Preserve these semantics even
when a framework uses a different shape.

`handler.ts` should read only middleware-guaranteed state, call a capability,
and translate its result:

```ts
export const Middleware = [
  requireSession(),
  requireOrganization({ param: "family_id" }),
  createValidator("param", Definition.schemas.Param),
  createValidator("json", Definition.schemas.Json),
]

export const Handler: EndpointHandler<AppEnv, typeof Definition> = async (c) => {
  const session = c.get("session")
  const { family_id } = c.req.valid("param")
  const input = c.req.valid("json")
  const preferences = await c.get("accounts").updatePreferences({
    actorId: session.user.id,
    familyId: family_id,
    input,
  })

  return c.json(...ok(preferences))
}
```

Do not let `Definition.schemas` imply validation that the route never registers.
Do not read raw request input after a validated source exists.

## Group and service registries

Use explicit registries so definitions and handlers can be compared at startup:

```ts
export const PreferenceDefinitions = [
  GetPreferenceDefinition,
  UpdatePreferenceDefinition,
] as const

export const PreferenceHandlers = {
  "get-family-preferences": GetPreferenceHandler,
  "update-family-preferences": UpdatePreferenceHandler,
} satisfies HandlerRegistry<typeof PreferenceDefinitions>
```

The group `index.ts` registers each definition with its handler and middleware on
an app supplied by the service. The service `mod.ts` exports its definition
catalog without constructing resources. The service `index.ts` builds or mounts
the app exactly once.

Startup validation must reject:

- a duplicate definition name or method/path pair;
- a definition without a handler;
- a handler without a definition;
- a referenced schema source without matching middleware;
- an operation documented as enabled but disabled at runtime;
- an endpoint that requires a capability absent from the service Layer.

Silently skipping a missing handler makes generated documentation lie.

## One composition root

The host entrypoint owns this sequence:

1. resolve and validate configuration;
2. construct long-lived resources;
3. assemble the Effect Layers or explicit capability object;
4. create one Hono root for this deployment boundary;
5. install root middleware once;
6. register service groups and endpoint middleware;
7. validate the registry/OpenAPI/reachability contract;
8. start listening and publish readiness;
9. on shutdown, stop admission, drain, close resources, and flush sinks.

```ts
export async function startAccountsHost(input: AccountsHostInput) {
  const config = AccountsConfig.parse(input.config)
  const resources = await makeAccountsResources(config)
  const runtime = ManagedRuntime.make(AccountsLive(resources))
  const app = createServer({ logger: resources.logger })

  registerAccountsEndpoints(app, { runtime })
  assertEndpointRegistry(app, AccountsDefinitions)

  return serve({
    app,
    port: config.port,
    close: async () => {
      await runtime.dispose()
      await resources.close()
    },
  })
}
```

This is illustrative, not a mandate to use `ManagedRuntime`. The invariant is
one owned runtime/resource graph with explicit lifetime.

Nested route groups must not call the server factory again. Recreating the root
commonly duplicates CORS, correlation IDs, request logs, error boundaries, and
resource construction.

## Domain and data seams

Handlers depend on capabilities, not concrete clients. A capability should use
domain terms and accept the policy facts it needs:

```ts
export interface AccountsService {
  readonly updatePreferences: (input: UpdatePreferencesInput) =>
    Effect.Effect<Preferences, FamilyNotFound | PreferencesConflict>
}
```

The data adapter receives a server-owned scope rather than an arbitrary client
filter:

```ts
export interface FamilyScope {
  readonly actorId: string
  readonly familyId: string
  readonly membershipId: string
}

export interface PreferencesStore {
  readonly update: (
    scope: FamilyScope,
    input: PreferencesPatch,
  ) => Effect.Effect<Preferences, StoreConflict | StoreUnavailable>
}
```

Do not name every data module `repository` automatically. A direct query module,
store, gateway, or adapter can be clearer. Do not leak Drizzle rows or provider
errors across the domain boundary.

## Workflow ownership

A synchronous handler may call a domain capability directly. A durable start
handler should validate and authorize, persist/submit through the workflow
control plane, and return an accepted result with stable inspection links:

```ts
const acceptedRun = await workflows.start({
  workflow: "publish-import",
  idempotencyKey: `${organization.id}:${upload.id}`,
  input: { organizationId: organization.id, uploadId: upload.id },
})

return c.json(...accepted({
  run_id: acceptedRun.id,
  status_url: `/imports/${acceptedRun.id}`,
  events_url: `/imports/${acceptedRun.id}/events`,
}))
```

The HTTP request does not keep the work alive. The accepted durable record or
engine command must exist before the 202 response. Business services own product
routes and authorization even when a shared workflow host owns execution.

## OpenAPI and reachability

OpenAPI generation consumes the same endpoint registry that runtime registration
consumes. It must include:

- stable operation IDs;
- every request source and content type;
- every success and known problem variant;
- auth/security scheme requirements;
- pagination/cursor contracts;
- 202 status and status/cancel/event links for durable starts;
- examples that parse under the schemas.

Then compare three sets:

```text
declared operations == registered runtime operations == request-tested operations
```

Generated schema equality is insufficient. Send actual requests to the composed
app and parse actual responses.

## Independent deployment

A service is independently deployable only if its artifact declares and tests:

- executable entrypoint and host adapter;
- config schema and required secrets;
- database, auth, workflow, object-storage, and network dependencies;
- migration ownership and compatibility window;
- readiness versus liveness checks;
- worker processes or task queues it requires;
- startup validation and graceful shutdown;
- public/internal ports and base paths;
- OpenAPI and event contract versions;
- deployment ordering and rollback compatibility.

Independent deployability does not require deploying every service separately.
It means boundaries are explicit enough that a separate deployment is possible
without importing a monolithic hidden composition root.

## Deliberate exclusions

- Do not create a microservice for every endpoint group.
- Do not place runtime construction in `mod.ts` barrel exports.
- Do not expose a generic workflow API that bypasses service authorization.
- Do not generate handler behavior from OpenAPI unless the generated runtime is
  the reviewed source of truth.
- Do not treat a workspace glob, future-plan document, or empty directory as an
  implemented service.
- Do not force Effect into a simple pure helper; use it where typed failures,
  resources, concurrency, cancellation, or composition justify it.

## Failure signatures

| Signature | Likely defect | Next proof |
|---|---|---|
| Definition exists but request returns 404 | Registry or deployed adapter omission | Trace definition to composed app and real request |
| Missing handler logs a warning | Partial registry accepted | Fail startup or mark capability unavailable |
| Middleware executes twice | Nested root construction | Count middleware invocation in request test |
| Import requires production env | Module-scope resource construction | Import test with empty env |
| Handler imports DB singleton | Composition boundary bypassed | Inject capability/client from root |
| OpenAPI advertises only 200 | Error and async contracts omitted | Compare actual status variants |
| One service cannot start alone | Hidden config/resource dependency | Minimal host fixture |
| Worker package exists but route uses legacy start | Durable path unreachable | Route-to-worker reachability test |
| Tenant ID appears only in user filter | Authorization delegated to caller | Server-owned scope/base constraint |

## Tests and verification

Required test layers:

1. definition schema tests for valid and invalid sources;
2. domain capability tests without HTTP;
3. adapter tests against the real database/protocol where risk warrants it;
4. registry conformance tests;
5. composed request tests with real middleware;
6. OpenAPI/runtime/request set equality;
7. auth and cross-organization isolation tests;
8. startup, readiness, drain, and shutdown tests;
9. standalone service artifact boot test;
10. durable-start reachability test when workflows are present.

Verification commands are repository-specific, but the evidence must include a
typecheck, focused tests, generated-contract validation, a standalone boot, and
at least one executable request for every operation changed.

## Evidence boundary

The uploaded service-module authoring guides define the target architecture. The
uploaded utility packages provide executable endpoint schemas, Standard Schema
validation, RFC problem helpers, query utilities, server construction, and a
workflow control-plane seam. Some referenced service directories are absent from
the supplied archives, and the SQL-backed Effect workflow adapter explicitly
returns not-implemented failures. Treat those surfaces as design evidence, not
proof of production reachability.

## Sources and freshness

- Attachments, verified 2026-07-17: `evidence/app/better-auth/docs/service-module-authoring.md`,
  `docs/service-module-structure.md`, `utils/endpoint/`, `utils/middleware/`, and
  `utils/server/` (normative plus observed source; target services are incomplete).
- Attachment, verified 2026-07-17: `evidence/app/new-finance/.agents/plans/services-and-service-modules.md`
  and `utils/workflows/` (planned ownership plus executable/counterexample evidence).
- Hono official documentation: https://hono.dev/docs/ (version-sensitive adapter behavior;
  verify against the installed release).
