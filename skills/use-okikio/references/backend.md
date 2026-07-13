# Backend utility and service-module patterns

## Endpoint definitions

The reviewed utilities include a `defineEndpoint(...)` pattern that preserves
literal method, route, and schema types, and `matchSchema(...)` over Standard
Schema's `~standard.validate`. A reusable definition can accept validator-neutral
schemas while the application remains Zod v4-first.

Register matching Hono validator middleware before reading validated request
values. Map expected validation failures to stable 422 problems and unexpected
validator defects to internal diagnostics.

## Service modules

The documented pattern assigns route contracts to `definition.ts`, behavior to
`handler.ts`, aggregate definitions to `mod.ts`, and root dependencies, handlers,
one server, and registration to `index.ts`. Treat this as a target pattern only
where the repository actually instantiates the services.

Use `workflows/` for business coordination and `runtime/` for worker/engine
bootstrap. Avoid nested server factories and silently skipped handlers.

## Query and response utilities

The reviewed query utilities separate source parsing, filters, sorts, fields,
cursor/offset pagination, count mode, and execution. Server-owned base filters
must precede user filters. Exact, planned, estimated, and no-count modes have
different contracts.

Problem utilities support stable OpenAPI responses and problem-type registries.
Describe complete result/response variants and never expose raw database errors.

## Database and server cautions

Central Drizzle re-export can prevent duplicate incompatible class instances.
Database factories should expose underlying lifetime/close ownership. Avoid the
reviewed counterexamples: LogTape configuration at module import, wildcard CORS
inside “production” defaults, literal patch markers in docs, and raw database
messages in public failures.

Compose with `build-apis` and `build-data` for full implementation and tests.
