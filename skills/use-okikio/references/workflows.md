# Okikio finance workflow platform: capabilities and limits

Use this reference only when the consuming repository contains the retained/private `@utils/workflows` source or an explicitly verified successor. It is an ambitious service-owned workflow control plane with real implementation and real gaps. Do not describe it as a complete durable engine without repairing and testing the gaps below.

## Contents

- Status and authority
- Capability inventory
- Definitions and policy
- Store and PostgreSQL model
- Control plane
- Workers and queues
- Effect runtime adapters
- Waits, signals, schedules, cancellation, and replay
- API integration
- Known durability gaps
- Productionization sequence
- Test and failpoint matrix
- Executable verification
- Deliberate exclusions
- Sources and freshness

## Status and authority

Observed identity: private/workspace `@utils/workflows` in the uploaded new/old finance repository. It is not established as a public JSR/npm package. Verify source path, export map, lockfile, and revision before using names.

The intended authority split is:

```text
service endpoint/event/webhook/schedule
  -> WorkflowControlPlane
  -> WorkflowStore (PostgreSQL intended durable public facts)
  -> ready queue / worker loops
  -> WorkflowRuntimeAdapter (Effect workflow execution)
```

PostgreSQL is intended to own product-facing execution/status/timeline/queue/wait/signal/schedule/cancellation facts. Effect workflow runtime owns execution semantics/result. Service modules own public routes, authentication, tenant/family authorization, and response copy.

Current status is mixed:

- memory store/runtime paths and substantial control-plane tests exist;
- PostgreSQL store and workflow schema exist;
- worker ticks and forever loops exist;
- Effect memory adapter calls real registered workflow operations;
- SQL-backed Effect adapter is an explicit placeholder returning not-implemented errors;
- event dispatch worker returns zero because event fan-out is synchronous in control plane;
- several multi-write transitions have crash gaps;
- cron calendar/timezone expansion remains incomplete.

## Capability inventory

Observed definition/control concepts include:

- object workflow input with schema validation;
- endpoint, event, webhook, schedule, delayed, and invoke triggers;
- idempotency and reuse-existing policy;
- retries/backoff;
- concurrency limits;
- throttle and rate limit;
- debounce and batch policy;
- singleton semantics;
- priority, queue, tags, cancellation capability;
- execution status and timeline;
- ready queue with leases, priority, availability, attempt, payload, error;
- events and event trigger matching;
- waits and signals;
- interval/delayed/cron schedule records;
- cancellation requests and targets;
- replay records/starts;
- memory/PostgreSQL stores;
- ready consumer, active run poller, scheduler, wait router, lease recovery;
- memory and placeholder SQL Effect runtime adapters;
- service-mountable endpoint helpers.

This is an inventory of authored surfaces. Each feature must be classified independently at the evidence ladder: defined, stored, reachable, worker-executed, restart-safe, operator-repairable.

## Definitions and policy

Definitions accept service-owned input schemas and dynamic key/filter callbacks. Observed policy shapes include keys derived from workflow input/context for idempotency, concurrency, throttle, rate-limit, debounce, batch, or singleton behavior.

Risks and requirements:

- callbacks are code, so deployed workflow version owns their semantics;
- input must be stable object data suitable for persistence/replay;
- dynamic keys must not contain secrets and need bounded length/canonicalization;
- definition name/version must remain resolvable for in-flight state;
- admission policies need durable state if they must survive process restart;
- process-memory debounce/concurrency maps are not cross-replica durability;
- changes to retry/cancellation/trigger policy need compatibility rules.

The retained control plane uses some process-local memory for policy bookkeeping. Inspect every policy before claiming multi-process enforcement.

## Store and PostgreSQL model

Observed tables cover workflow executions, timeline, ready queue, events, waits, signals, schedules, cancellation, and replay-related facts under a `workflows` schema.

Store requirements before production:

- unique idempotency key at the correct service/workflow/scope boundary;
- atomic execution + initial timeline + queue acceptance;
- atomic per-execution timeline sequence allocation;
- atomic/fenced queue claim and acknowledgement;
- conditional terminal/status transitions;
- atomic or repairable signal/wait/enqueue transition;
- atomic or repairable schedule occurrence publication;
- indexes for active runs, ready/expired leases, due waits/schedules, idempotency;
- migration/upgrade and retention policy;
- operator queries/repair transactions;
- explicit DB client lifetime.

Observed gaps:

- `createExecution()` checks idempotency, inserts execution, appends timeline records, then enqueues across separate calls;
- `appendTimeline()` selects existing entries and uses `existing.length + 1`;
- ready claim selects rows then conditionally updates each; owner-fenced acknowledgement needs verification;
- signal/wait/resume operations are several writes;
- wait timeout marks timed out before enqueue;
- cancellation request and targets may be separate writes depending on inspected path.

Comments sometimes describe partial states as operator-repairable, but a repair loop/tool is not automatically present. Implement and test it.

## Control plane

Observed operations include starts/invokes, event recording/fan-out, status/timeline reads, cancellation, resume, signaling, replay, schedule/event interaction, and poll-to-store reconciliation.

Start flow conceptually:

```text
lookup definition
  -> validate object input
  -> compute runtime/deterministic execution ID
  -> resolve idempotency and admission policy
  -> construct execution, first timeline entries, optional queue row
  -> store.createExecution(...)
  -> return execution/status/cancel URLs
```

Production requirements:

- acceptance is atomic or has an implemented reconciler;
- idempotency is protected by database constraint/atomic write;
- URL builders reflect the actual service-owned route;
- admission state is durable across replicas when promised;
- skipped/delayed states are explicit;
- no external runtime/effect starts before durable intent;
- poll reconciliation handles missing/running/suspended/success/failure/cancelled distinctly;
- public status never implies an external effect committed without domain evidence.

## Workers and queues

Observed tick functions:

- `tickReadyQueueConsumer`;
- `tickActiveRunPoller`;
- `tickScheduler`;
- `tickWaitRouter`;
- `tickLeaseRecovery`;
- `tickEventDispatcher` (currently returns `0`).

`createWorkflowWorkerLoops()` wraps ticks in forever loops for a supervisor. Prove that a deployed process actually boots/supervises these loops and exposes readiness/heartbeat.

Queue dispatch updates execution to running, appends timeline, starts/resumes runtime, acknowledges row, and polls. A crash between runtime effect and ack can redeliver. Runtime start/resume must be idempotent by execution ID. A crash after marking running but before start needs reconciliation.

Add/verify:

- lease renewal for work exceeding lease duration;
- owner/version fencing on ack/dead/heartbeat;
- bounded attempts and backoff/requeue rather than immediate terminal failure for all errors;
- graceful shutdown;
- deployment/version compatibility;
- dead-letter operator redrive;
- metrics for queue age, claims, expiries, attempts, dead rows, active heartbeat.

## Effect runtime adapters

Observed `WorkflowRuntimeAdapter` surface includes:

- list/register workflows;
- compute execution ID;
- start;
- poll;
- interrupt;
- resume.

The memory adapter looks up registrations, validates object input, calls `workflow.executionId`, `workflow.execute(..., { discard: true })`, `workflow.poll`, `workflow.interrupt`, and `workflow.resume` through an injected runner. It is useful for tests/local wiring but is not process-loss durability.

The `effect_sql` adapter currently returns `workflow_runtime_not_implemented` for every operation. Its name and stable seam are not capability evidence. Do not enable public start/status/cancel routes against it as though they work.

`@effect/workflow` is version-sensitive/alpha in the broader research. Inspect exact installed imports, engine persistence, execution ID semantics, suspension, polling, interrupt/resume, schema evolution, and Layer requirements. Do not fabricate an SQL Layer or adapter API from memory.

## Waits, signals, schedules, cancellation, and replay

Wait/signal intended flow:

```text
runtime suspends -> active wait row with matcher/resume token/timeout
signal endpoint -> record signal -> satisfy wait -> enqueue resume
timeout worker -> time out wait -> enqueue timeout resume
worker -> runtime resume -> poll/store projection
```

Require a single-winner rule for signal versus timeout versus cancellation. Conditional state transitions must prevent multiple resume rows, or deterministic occurrence identity must deduplicate them.

Schedules:

- interval next-run logic exists;
- delayed one-shot semantics exist;
- cron can be stored but calendar/timezone expansion is incomplete per retained README/code comments;
- two schedulers need atomic due occurrence claiming and deterministic occurrence IDs.

Cancellation:

- distinguish requested, cancelling, target applied, and final cancelled;
- pending work may be cancelled without runtime interrupt;
- started work needs actual runtime interrupt and poll reconciliation;
- cancellation can race terminal success/failure;
- external activities need cooperative cancellation/compensation policies.

Replay should create a related new execution or an explicit replay lineage without rewriting old history. Side effects still require replay-safe activity identities.

## API integration

Service modules own routes, authentication, tenant/family authorization, and response shape. Workflow helpers can adapt control-plane operations, but generic workflow utilities must not infer product authorization.

Conceptual integration:

```ts
app.post('/organizations/:org/imports', authz, validate, async (c) => {
  const accepted = await controlPlane.startWorkflow({
    workflow_name: 'ImportTransactions',
    input: { organizationId: c.get('org').id, ...c.req.valid('json') },
    idempotency_key: c.req.header('Idempotency-Key'),
    status_url: `/organizations/${org}/imports/${id}/status`,
  })
  return c.json(toAccepted(accepted), 202)
})
```

The example is conceptual; inspect actual helper signatures. Apply equivalent authz to status, timeline, signal, cancel, and replay. Avoid leaking existence across tenants.

## Known durability gaps

| Gap | Failure window | Required correction/proof |
|---|---|---|
| idempotency read then insert | concurrent duplicate starts | unique constraint/atomic insert |
| execution/timeline/queue separate | accepted orphan or incomplete history | transaction/outbox/reconciler |
| timeline `existing.length + 1` | sequence collision | atomic counter/lock/sequence constraint |
| select then conditional queue claim | concurrency/fairness/fencing questions | multi-worker oracle and owner-fenced updates |
| signal/wait/enqueue separate | signal accepted but no resume | transaction/outbox/reconciler |
| timeout status before enqueue | timed-out wait never resumed | transaction/outbox/reconciler |
| runtime call versus store status | running/no runtime or runtime/no status | idempotent start and reconciliation |
| SQL Effect adapter placeholder | no durable execution backend | implement verified Layer/adapter or disable |
| event dispatcher returns zero | async dispatch not implemented | document synchronous path or implement durable worker |
| cron expansion missing | stored cron never advances | implement versioned timezone parser or reject |
| process-local policy memory | cross-replica divergence | durable atomic policy state or narrow claim |

## Productionization sequence

1. Inventory which capabilities product routes actually need.
2. Disable/unregister unsupported paths and make readiness honest.
3. Add database constraints/indexes and transactional acceptance.
4. Implement repair scans/tools for every retained partial state.
5. Choose and implement the real durable runtime adapter at pinned versions.
6. Add owner-fenced leases, renewal, retry/dead/redrive, and worker supervision.
7. Repair waits/signals/schedules/cancellation atomicity.
8. Define versioning for definitions, inputs, checkpoints, and in-flight runs.
9. Run failpoint/restart tests against PostgreSQL and the real runtime.
10. Deploy workers separately/explicitly, expose health/readiness/metrics, and test operator controls.

## Test and failpoint matrix

Test:

- definition/input validation and duplicate registration;
- concurrent idempotent starts across processes;
- crash after every execution/timeline/queue write;
- two-worker claim, lease expiry, old-owner ack, long-run heartbeat;
- runtime start before/after store status failpoints;
- process restart with memory versus durable adapter;
- signal versus timeout versus cancel race;
- crash after each signal/wait/resume write;
- two schedulers and duplicate due occurrence;
- interval/delayed and explicit rejection of unsupported cron;
- cancellation before start, during run, and racing success/failure;
- replay with external side-effect idempotency;
- event fan-out path and honest dispatcher status;
- deployment with queued old workflow version;
- worker shutdown and restart;
- operator repair/redrive audit;
- route authz for start/status/timeline/signal/cancel/replay.

## Executable verification

Use a disposable PostgreSQL instance and the actually selected Effect runtime. Run control-plane tests, then deterministic failpoint tests that kill and restart processes. Query workflow tables and call real service endpoints. Require convergence between runtime result and public execution projection, no lost accepted runs, idempotent duplicate delivery, safe wait/signal/schedule races, reachable worker loops, and idempotent operator repair.

Memory-adapter tests cannot satisfy the durable-backend gate. If no real runtime is configured, record durable runtime verification as blocked and do not claim production readiness.

## Deliberate exclusions

- Do not claim `@utils/workflows` is public or installable without evidence.
- Do not call the current SQL Effect adapter implemented.
- Do not call memory behavior durable.
- Do not force this platform when Temporal, Effect Workflow, a simpler job store, or another selected owner is more appropriate.
- Do not infer atomicity from one store interface method when its implementation performs multiple writes.
- Do not expose unsupported cron/cancel/replay behavior as successful.
- Do not assume workflow durability makes external effects idempotent.
- Do not invent APIs beyond inspected exports/source.

## Sources and freshness

Grounded in the complete retained finance `utils/workflows` README, definitions, registration, types, control plane, store/memory/PostgreSQL implementations, endpoints, events, worker boot/loops, runtime types/memory/effect-sql adapters, workflow database schema/migration, tests and benchmarks, reviewed 2026-07-17. This is private/workspace source evidence. `@effect/workflow` and Effect runtime APIs are version-sensitive and require installed-source verification.
