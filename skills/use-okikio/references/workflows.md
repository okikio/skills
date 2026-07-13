# Personal workflow platform patterns

The reviewed finance utilities define workflow input, triggers, idempotency,
retry, concurrency, throttle, rate limit, debounce, batch, singleton,
cancellation, and observability, plus a control plane, durable store, PostgreSQL
store, queue, timelines, waits, signals, schedules, and worker loops.

## Capability status

Do not call the platform complete from those types. In the reviewed source:

- an event dispatcher remains a `return 0` scaffold;
- documentation says current HTTP handlers still use the old control plane;
- execution insert, timeline append, and enqueue are separate operations;
- timeline sequence uses `existing.length + 1`;
- idempotency uses read then insert;
- queue claiming reads then conditionally updates;
- wait timeout resolution and resume enqueue can split across a crash.

These are evidence of an ambitious design with real incomplete durability and
reachability, not a finished engine.

## Reuse rule

Reuse definitions or interfaces only after mapping their authority, transaction,
worker, engine, queue, and API path in the consuming repository. Prefer schemas
as structured-data sources where current code uses parallel interfaces.

Require atomic uniqueness/sequence/claims, transactions for related database
writes, idempotent cross-system effects, reconciliation, restart tests, worker
deployment, and operator repair before production claims.

Compose with `build-workflows` for the full durability evidence ladder.
