---
name: build-workflows
description: Design, implement, migrate, review, diagnose, or verify durable workflows, workers, queues, scheduled jobs, timers, signals, retries, resumable pipelines, and multi-stage ingestion. Use for Temporal, Effect Workflow, control planes, leases, checkpoints, idempotency, concurrency, throttling, batching, singleton work, cancellation, replay, operator recovery, and cross-system reconciliation. Do not call an in-memory promise chain durable merely because it retries.
---

# Build durable workflows and pipelines

Start from failure and recovery semantics. When active, `build-data` owns
storage-engine and artifact design and `build-apis` owns HTTP exposure.
Otherwise preserve those boundary checks locally. This skill owns durable
coordination and reachability.

## Durability evidence ladder

Classify every claimed capability independently:

1. workflow authored;
2. workflow registered;
3. runtime adapter implemented;
4. worker booted and reachable;
5. durable projection persisted;
6. queue, timer, wait, signal, and cancellation paths implemented;
7. restart/replay behavior verified;
8. operator inspection, repair, retry, and reconciliation exist;
9. public API or CLI reaches the new system.

A definition, table, adapter, unit test, or “dispatcher” stub does not prove the
workflow is operational.

## Required decision model

For every workflow, answer:

- Which history or record is authoritative?
- What survives process loss?
- What identifies a logical run, attempt, and external effect?
- Which deliveries and effects are at-least-once?
- Where are uniqueness and idempotency enforced atomically?
- Which state transitions require one database transaction?
- Which cross-system gaps require reconciliation?
- How are leases, poison work, backpressure, and rate limits handled?
- How do version changes affect replay and in-flight runs?
- How does an operator inspect, retry, cancel, resume, or repair work?
- Is the actual worker deployed, healthy, and reachable?

## Procedure

1. Define durable/transient state, identities, triggers, stage contracts, and
   completion criteria.
2. Choose the engine from timers, replay, signals, throughput, latency,
   operational, and deployment requirements. Record maturity/version boundaries.
3. Make retryable external effects idempotent or atomically deduplicated.
4. Keep replayed orchestration deterministic; isolate nondeterministic I/O in
   activities/effects with explicit retry and timeout policy.
5. Make checkpoints represent committed work and retain enough provenance to
   validate resume.
6. Treat cross-system writes as sagas with repair unless one transaction truly
   covers them.
7. Define cancellation, lease expiry, poison handling, dead letters, manual
   override, and audit timelines.
8. Verify crashes between every important pair of writes, duplicate delivery,
   concurrent starts, worker loss, replay, resume, and operator recovery.

## Reference routing

- [durability.md](references/durability.md): engine selection, authority,
  identities, determinism, and completion.
- [control-plane.md](references/control-plane.md): definitions, registration,
  admission, projections, reachability, and API/CLI integration.
- [atomicity.md](references/atomicity.md): transactions, idempotency, sequences,
  cross-system gaps, and reconciliation.
- [workers.md](references/workers.md): queues, leases, timers, waits, signals,
  schedules, cancellation, backpressure, and poison work.
- [pipelines.md](references/pipelines.md): staged ingestion, provenance,
  bounded batches, checkpoints, manifests, and projections.
- [failures.md](references/failures.md): evidence-grounded failure signatures.

Do not claim durability until interruption and restart have been executed against
the real persistence and worker path.
