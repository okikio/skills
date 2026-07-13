# Service module architecture

## Suggested ownership

- `definition.ts` owns method, route, input schemas, response/result schemas,
  metadata, and OpenAPI description.
- `handler.ts` owns endpoint behavior against explicit services.
- Group and service `mod.ts` files aggregate endpoint definitions.
- Service `index.ts` aggregates handlers, constructs long-lived dependencies,
  creates one root app, and registers definitions dynamically or statically.
- `workflows/` owns business orchestration; `runtime/` owns worker or engine
  bootstrap. Avoid an ambiguous `orchestrator/` bucket.

Names may differ, but each contract needs one owner.

## Reachability trace

```text
definition
  -> exported group/service registry
  -> handler registry
  -> root server registration
  -> middleware chain
  -> deployed adapter
  -> executable request
```

A definition or handler file that never reaches the root registry is not an
implemented endpoint. Do not silently skip missing handlers with a warning while
advertising the definition as available.

## One composition root

Call the server factory once per deployment boundary. Nested groups should mount
routes or middleware on the existing app, not create another root that repeats
correlation, logging, CORS, error, or auth middleware.

## Middleware ownership

Use an explicit order such as:

1. request identity/correlation and context;
2. trusted proxy/origin and security policy;
3. logging and timing;
4. CORS where required;
5. authentication/session loading;
6. service dependency adapters;
7. route authorization and validation;
8. handler;
9. centralized error/response normalization.

The exact order is repository-specific. Test ordering rather than assuming Hono
or another framework deduplicates repeated middleware.
