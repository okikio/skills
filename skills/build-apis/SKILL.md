---
name: build-apis
description: Design, implement, review, or refactor HTTP APIs and service modules with schema-backed contracts, middleware, authentication, errors, pagination, observability, and integration tests. Use with Hono, Zod, Standard Schema, Better Auth, and database clients.
---

# Build APIs

Map transport, middleware, validation, service, database, and response. Use
`explore-ecosystems` for dependency choices.

1. Give transport, domain service, persistence, and authentication clear owners.
2. Define runtime schemas and infer types. Accept Standard Schema where
   validator interoperability is the actual contract.
3. Map errors to stable safe responses without erasing causes.
4. Keep utilities generic only where multiple services share the contract; avoid
   repository layers by habit.
5. Test middleware order, auth/session behavior, invalid input, pagination,
   concurrency, and database failure. Run a real request.

Read [stack.md](references/stack.md).
