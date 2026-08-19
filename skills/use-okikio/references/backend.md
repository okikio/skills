# Okikio backend utilities and service-module architecture

Use this reference when working inside a retained Okikio finance-style repository or evaluating whether its private/workspace backend utilities should be reused. These are observed codebase capabilities, not presumed public packages. Verify manifests, exports, versions, and consumer imports before using any symbol.

## Contents

- Status and package identity
- Complete service-module model
- Endpoint contracts
- Validation and Standard Schema seam
- Response and Problem Details
- Query utilities
- Database and execution utilities
- Auth and middleware utilities
- Server composition
- Integration sequence
- Known counterexamples and repair
- Test matrix
- Executable verification
- Deliberate exclusions
- Sources and freshness

## Status and package identity

Observed private/workspace packages under the retained finance codebase include:

```text
@utils/endpoint
@utils/response
@utils/query
@utils/execution
@utils/middleware
@utils/server
@utils/db
@utils/auth
@utils/workflows
@utils/env
```

Do not install these names from a registry based on this guide. Before reuse:

1. Inspect the consumer's workspace manifests and lockfile.
2. Resolve the actual package path/version.
3. Read its `deno.jsonc`/`package.json` export map and `mod.ts`.
4. Confirm whether the code is source-imported, built, or published.
5. Run import/type/runtime tests at the exact consumer revision.

The current reference describes the uploaded new/old finance source as of 2026-07-17. Some files contain active repairs, experimental workflow work, and counterexamples.

## Complete service-module model

The retained guides define this target architecture:

```text
services/<service>/
  endpoints/
    <group>/
      <action>/
        definition.ts
        handler.ts
      mod.ts
      index.ts            optional, plain route module only
  workflows/              durable business orchestration only when real
  activities/             side-effecting workflow units
  runtime/                engine/layer/worker/registration wiring
  domain/                 service domain schemas/rules/errors
  data/                   repositories/storage-specific operations
  mod.ts                  contract registry
  index.ts                runtime registry and one service composition root
```

Ownership:

| File/folder | Owns | Must not own |
|---|---|---|
| endpoint `definition.ts` | name, route, methods, request-source schemas, response contract | DB clients, auth sessions, workflow runtime |
| endpoint `handler.ts` | route middleware, validated input, domain/workflow call, response mapping | root framework setup, import-time resources |
| group/service `mod.ts` | aggregated `EndpointDefinitions` contract objects | server construction/side effects |
| service `index.ts` | `EndpointHandlers`, one server, dependency middleware, route registration | reusable pure contract exports only |
| `workflows/` | durable step ordering/retry/wait/compensation | HTTP details or worker bootstrap |
| `activities/` | side effects with idempotency/retry contract | orchestration state machine |
| `runtime/` | engine Layers/adapters, registration, worker host | product route copy |

Do not create `workflows/activities/runtime` as empty architecture theatre. Add them only when durable behavior and deployment exist. `orchestrator/` is intentionally avoided because it can confuse business orchestration with runtime/client ownership.

## Endpoint contracts

The observed `defineEndpoint(...)` pattern preserves literal name, method, route, schema, and response types. Conceptual shape:

```ts
export default defineEndpoint({
  Name: 'list-accounts',
  Route: '/organizations/:organization_id/accounts',
  Methods: ['GET'] as const,
  Schemas: {
    Param: ParamSchema,
    Query: QuerySchema,
    Header: HeaderSchema,
  },
  Response: ResponseSchema,
})
```

Observed source kinds include JSON, Query, Param, Header, Form, and Cookie through endpoint/validation utilities. Verify the exact generic names and schema keys in current source.

Handler shape:

```ts
export const Middleware = [
  createAuthOptionalContextMiddleware(auth),
  createAuthRequiredContextMiddleware(auth),
  createOrganizationRequiredContextMiddleware(),
  createValidator('param', Definition.Schemas.Param),
  createValidator('query', Definition.Schemas.Query),
]

export const Handler = async (c) => {
  const params = c.req.valid('param')
  const query = c.req.valid('query')
  // call domain/data/workflow capability
}
```

Middleware must match every `c.req.valid(source)` call. A definition alone does not install validators. Route definition/handler/middleware mapping must be checked at startup and by a real request.

## Validation and Standard Schema seam

The retained endpoint utilities include a `matchSchema(...)` pattern over Standard Schema's `~standard.validate`. This can keep endpoint definitions validator-neutral while an application uses Zod v4 or another Standard Schema implementation.

Operational requirements:

- confirm the object implements the installed Standard Schema contract;
- handle sync and async validation results;
- normalize issue paths/messages without losing source location;
- keep transport decoding separate from domain validation;
- map expected validation to a stable 400/422 contract;
- treat validator exceptions/invalid implementations as internal defects;
- infer types through the selected schema library's supported helper, not guessed properties.

Do not force Zod when a consumer selected another Standard Schema implementation. Conversely, do not claim any object with a `parse` method is Standard Schema compatible.

## Response and Problem Details

Observed `@utils/response` areas include:

- success helpers and schemas;
- status codes;
- error/problem helpers;
- RFC 9457-style Problem Details;
- problem type registries/docs/localization/trace extensions in current server integration.

Model full response behavior:

```text
status + headers + payload/envelope
```

not payload alone. Stable problems should separate machine fields (`type`, `status`, stable extension codes) from localized display text (`title`, `detail`). Resolve request-specific `instance` and trace at the HTTP adapter. Do not return raw database/provider/stack messages.

Verify actual exports before naming helpers such as `ok`, `accepted`, `badRequest`, `gone`, or `internalServerError`; these names are observed in uploaded source but may change or remain private.

## Query utilities

Observed `@utils/query` capabilities:

- bracket/JSON/form filter adapters;
- per-field operator/type/enum registries;
- operators including equality/range/set/string/null;
- filter count caps;
- sort adapters/defaults/allowlists/tiebreakers;
- simple and JSON:API-style field selection;
- offset and signed HMAC cursor pagination;
- query component disable flags;
- exact/planned/estimated/no-count metadata;
- composite endpoint query schemas;
- extensive tests and benchmarks.

Important caveats:

- exact exports are workspace-private until confirmed;
- empty allowlist semantics must be checked and should not expose arbitrary storage fields;
- cursor schema inspected does not bind filter/resource context visibly;
- query compilation remains storage-specific;
- server-owned organization/resource filters must precede user filters;
- type/schema success does not prove query plans or stable pagination.

Compose with `build-apis/references/queries.md` and `build-data/references/queries.md` rather than copying these utilities blindly.

## Database and execution utilities

Observed `@utils/db` provides:

- lazy `DATABASE_URL` validation;
- `postgres.js` client construction;
- Drizzle `postgres-js` wrapper with shared schema;
- auth, finance, and workflow schema exports;
- optional Drizzle query logger integration;
- a central Drizzle re-export surface to avoid duplicate class identity;
- Drizzle Kit config/migrations.

Observed default choices include pool `max: 10` and `prepare: false`; derive consumer settings from actual topology. The current `createDatabase()` hides the underlying client inside the returned Drizzle wrapper, so close/drain ownership needs repair or an alternate factory before claiming graceful shutdown.

Observed `@utils/execution` contains storage-specific execution helpers for Drizzle/database and SPARQL. The SPARQL implementation maps query filters/sorts/cursors into an `@okikio/sparql` builder and transport. Inspect it carefully: some special operators combine raw expression strings, date cursors may reduce precision, and term comparison semantics depend on the engine.

## Auth and middleware utilities

Observed auth utilities include server/client factories, framework-specific clients (React/Solid/Svelte/Vue/Lynx paths in source), environment parsing, routes, and Better Auth integration. Confirm exact plugins/options at installed Better Auth version.

Observed middleware areas include:

- authentication and optional/required context;
- organization optional/required context;
- correlation/trace/logger access;
- DB context;
- validation.

Policy order:

```text
session identification
  -> current user requirement
  -> current organization membership/permission
  -> resource belongs to authorized organization
  -> validated public query/body
  -> server-scoped data operation
```

Do not treat active organization stored in a session as timeless authorization. Revalidate according to sensitivity/long-lived stream policy.

## Server composition

The intended pattern is one `createServer(...)` call per service root. Root middleware can own request ID, correlation, diagnostics, CORS, security headers, timing, trailing slash policy, health, and final error handling. Service middleware adapts long-lived dependencies. Route middleware owns auth/policy/validation.

Hono does not deduplicate middleware. Calling the root factory in nested groups can execute logging/correlation/CORS/timing twice.

Current retained server counterexamples to repair before reuse:

- default `cors: true` described as all origins;
- module-scope `await configure(...)` for LogTape;
- global logger configuration from a reusable package;
- pretty JSON enabled by default in a production-optimized object;
- literal `+` patch markers in a comment block;
- import-time boot log.

These violate import safety/configuration ownership and should not be normalized as “Okikio style.” If LogTape is selected, the application entrypoint configures it once and injects/uses categories; otherwise preserve the selected logger.

## Integration sequence

```text
definition.ts declares public contract
  -> mod.ts aggregates definitions without side effects
  -> composition root parses config and constructs DB/auth/providers/runtime
  -> index.ts maps definition names to handler modules
  -> startup fails or marks unavailable for mismatches
  -> root middleware installed once
  -> route middleware establishes auth/policy/validation
  -> handler calls domain/data/workflow capability
  -> response helper emits declared status/headers/body
  -> error mapper maps one stable problem and correlated diagnostic
  -> shutdown drains and closes owned resources
```

## Known counterexamples and repair

| Observed/candidate pattern | Why unsafe/incomplete | Repair |
|---|---|---|
| definition/handler exists | not necessarily registered/reachable | conformance plus real request |
| nested `createServer()` | root middleware duplicates | one composition root |
| `c.req.valid()` without validator | no runtime guarantee | matching middleware |
| import-time LogTape configure | reusable module mutates global state | app entrypoint owns config |
| wildcard CORS default | unsafe with credentials/private APIs | explicit origin/method/header policy |
| DB wrapper hides client | shutdown handle missing | return/accept owned resource |
| raw DB message in Problem | internal/security leak | stable mapping, redacted cause |
| empty 200 stub | false capability | unregister/501/implement |
| workflow folder without worker/runtime | architecture scaffold | prove durable path or remove |

## Test matrix

Test:

- import `mod.ts`, definitions, schemas without env/network/global logger mutation;
- all definition names/methods/routes unique;
- every definition has one matching handler and declared middleware;
- OpenAPI and runtime route inventories agree;
- each request source validator and normalized output;
- positive/negative auth and organization/resource policy;
- middleware exact invocation count/order;
- stable success and every problem response variant;
- query filters/sorts/fields/cursors/counts and semantic compatibility;
- DB/schema migration and pool close/drain;
- SPARQL generated query/term behavior against the selected engine;
- dependency timeout/cancellation/restart;
- standalone boot, readiness, actual HTTP requests, and shutdown;
- workflow trigger/status/cancel only when runtime capability is real.

## Executable verification

Use workspace-native tasks. At minimum:

```bash
deno check services/<service>/mod.ts services/<service>/index.ts
deno test -P utils/endpoint utils/query utils/response utils/middleware utils/db
```

Adapt to actual task ownership and permissions. Boot the service with disposable dependencies, issue real requests for every route and negative policy, inspect route/OpenAPI registries, run migration and query integration, and confirm process exit after shutdown. Package-level type tests alone do not prove a service module.

## Deliberate exclusions

- Do not claim `@utils/*` packages are public/installable without registry/repository evidence.
- Do not invent exports from remembered names; inspect `mod.ts` and export maps.
- Do not force Zod, LogTape, Drizzle, Hono, Better Auth, Effect, or SPARQL into a consumer that selected another owner.
- Do not copy known counterexamples as architecture.
- Do not add workflow folders when work is synchronous/bounded and no durable runtime is selected.
- Do not treat generated OpenAPI, definitions, or types as reachability proof.
- Do not hide client lifetimes or configure process globals at import.

## Sources and freshness

Grounded in the retained new/old finance service-module structure and authoring guides and the complete observed `utils/{endpoint,response,query,execution,middleware,server,db,auth,workflows,env}` sources, tests, benchmarks, schemas, manifests, and migrations, reviewed 2026-07-17. These are private/workspace observations unless a specific public package is independently verified. Several files contain experimental or incomplete paths; the status and counterexamples above are source-level findings, not accusations about a deployed service.
