# Service-module architecture

## Contents

- [Outcome](#outcome)
- [Terms and ownership](#terms-and-ownership)
- [Published contract packages](#published-contract-packages)
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
- [Evidence limit](#evidence-limit)

## Outcome

A service module is complete when a reviewer can find its public contracts,
middleware guarantees, behavior, domain capabilities, data access, resources,
registration, deployment entrypoint, and executable requests without reverse
engineering a generic framework. A file named `definition.ts` or a generated
OpenAPI operation is not implementation evidence by itself.

## Terms and ownership

| Term | Owns | Does not own |
|---|---|---|
| Service | One top-level runtime/deployment unit such as accounts or ledger | Every related concept in the product |
| Service module | A coherent endpoint/domain slice inside a service | A separate server by default |
| Endpoint definition | Static transport contract and documentation | Business behavior or resource construction |
| Endpoint handler | Translation from validated transport input to a capability call | Database construction, global middleware, or workflow worker boot |
| Domain capability | Business operation and typed domain failures | Hono context or HTTP response tuples |
| Data adapter | Queries and persistence against an explicit client/transaction | Tenant authorization policy unless the policy is encoded as a required scope |
| Composition root | Configuration, resources, Layer graph, app construction, registration, shutdown | Domain policy |

Use “service module” consistently. A service is a top-level executable unit;
`accounts/preferences` can be a module within the `accounts` service. Do not
split a module into a network service solely because it has a folder.

## Published contract packages

The service or domain capability authors the **pure** endpoint definitions,
request/response schemas, problem variants, and OpenAPI metadata. The runtime
composes handlers, policy, and resources from those definitions. A published
`packages/contracts/` package re-exports the service-authored pure modules
and, when needed, generated OpenAPI or typed clients. The public package must
not define a second catalog that the service imports to learn its own routes.

Keep definitions import-safe: loading a published contract must not acquire a
connection, load deployment secrets, register process signals, or start a
server. When packaging source from another folder, ensure the build includes
only the pure contract dependency graph and resolves it without a cycle. Prove
this with a clean packed-package consumer as well as an actual mounted route.

## Target module shape

Start with the smallest shape that owns the current behavior. For two
independently meaningful endpoints, that can be:

```text
services/accounts/
├── preferences/
│   ├── definition.ts  # Import-safe schemas and endpoint definitions
│   └── handler.ts     # Runtime capability calls
├── mod.ts             # Pure definition exports
└── index.ts           # Runtime composition and host
```

Add `domain/` and `data/` only when their separate decisions or adapters
need distinct modules. Split individual operations into more files only when
it clarifies ownership or keeps resource-backed code out of pure contract
imports. Do not add `get/`, `update/`, or registries to mirror a sample tree.

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

export const ParamsSchema = z.object({ family_id: z.uuid() })
export const JsonSchema = z.object({ currency: z.string().length(3) })
export const ResultSchema = z.object({ family_id: z.uuid(), currency: z.string() })

export const Definition = defineEndpoint({
  name: "update-family-preferences",
  method: "PATCH",
  route: "/families/:family_id/preferences",
  schemas: { Param: ParamsSchema, Json: JsonSchema },
  responses: {
    200: jsonResponse(ResultSchema, "Preferences updated"),
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

Author a pure definition catalog only when a consumer needs one. Bind each
handler directly to the corresponding definition in the runtime host. Do not
create two independent registries that duplicate route identities simply to
validate each other:

In the import-safe `preferences/definition.ts` module:

```ts
export const PreferenceDefinitions = [
  GetPreferenceDefinition,
  UpdatePreferenceDefinition,
] as const
```

In the runtime host, bind those same service-authored definitions to handlers:

```ts
register(app, GetPreferenceDefinition, GetPreferenceHandler)
register(app, UpdatePreferenceDefinition, UpdatePreferenceHandler)
```

Public contract packages import only the pure `PreferenceDefinitions` and the
underlying definitions, never the runtime registration or handlers. The host
owns middleware and binds resources. Direct typed registration is often
clearer than another registry or adapter layer.

For *dynamic* registration, validate at startup that no registration is
missing, duplicated, or unsupported. For *static* registration, prefer
compile-time relationships and focused request tests. Relevant checks include:

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
4. create one Hono root for this deployment unit;
5. install root middleware once;
6. register service groups and endpoint middleware;
7. check dynamic registrations where present and test route reachability;
8. start listening and publish readiness;
9. on shutdown, stop admission, drain, close resources, and flush sinks.

```ts
export async function startAccountsHost(input: AccountsHostInput) {
  const config = AccountsConfig.parse(input.config)
  const resources = await makeAccountsResources(config)
  const runtime = ManagedRuntime.make(AccountsLive(resources))
  const app = createServer({ logger: resources.logger })

  registerAccountsEndpoints(app, { runtime })

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
commonly duplicates CORS, correlation IDs, request logs, error mappers, and
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
errors across the domain interface.

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
It means service APIs are explicit enough that a separate deployment is possible
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
| Handler imports DB singleton | Composition scope bypassed | Inject capability/client from root |
| OpenAPI advertises only 200 | Error and async contracts omitted | Compare actual status variants |
| One service cannot start alone | Hidden config/resource dependency | Minimal host fixture |
| Worker package exists but route uses legacy start | Durable path unreachable | Route-to-worker reachability test |
| Tenant ID appears only in user filter | Authorization delegated to caller | Server-owned scope/base constraint |

## Tests and verification

Choose the relevant test layers from the changed failure risk; do not run
all of them for every small endpoint change:

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

For a changed public route, verify its relevant schema and a real composed
request, plus the generated contract if it is published. For a newly deployed
host or changed resource lifecycle, verify standalone boot and shutdown.
Test independent service deployment only when the deliverable claims it. Report
unavailable runtime or deployment proof explicitly instead of creating a
second, simulated qualification system.

## Evidence limit

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
