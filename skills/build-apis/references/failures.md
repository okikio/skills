# API failure signatures

| Signature | Likely defect | Correction evidence |
|---|---|---|
| `c.req.valid()` is empty or unsafe | Matching validator middleware missing | Definition, middleware registration, request test |
| Middleware fires twice | Nested root server construction | One composition root and invocation count |
| OpenAPI lists an endpoint that returns nothing | Definition registered without reachable handler | Registry-to-request trace |
| Stub returns empty 200 | Unavailable capability hidden as success | Unregister or explicit 501/unavailable contract |
| Authenticated user sees another org | Auth mistaken for authorization | Membership policy and server base filter |
| Import fails without env | Resource construction at module scope | Import-safe factory and explicit composition root |
| Client receives SQL/provider message | Raw cause leaked | Stable problem plus redacted structured log |
| CORS allows every origin unexpectedly | “Production” defaults are unsafe | Explicit origin/credential policy |
| Response schema passes but client fails | Payload-only schema omits status/headers/result wrapper | Parse actual response variants |
| Type exported with `typeof Schema.Input` | Schema object type mistaken for inferred data | Infer through schema/type helper |
| Missing handler only warns | Registry tolerates partial reachability | Startup validation or explicit capability status |
| DB pool never closes | Lifetime handle hidden | Composition-root close/drain test |

Treat documentation markers, workspace globs, and generated OpenAPI as evidence
to inspect, not proof that the runtime path is complete.
