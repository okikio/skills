# Durability and engine selection

## When an engine is justified

Use a durable engine when work must survive process or host loss and needs one or
more of: durable timers, replay, signals/updates, long coordination, leases,
cross-process recovery, audited history, or operator control.

A simple scheduled command, database job table, queue, or in-process pipeline may
be sufficient when its failure and recovery contract is explicit. Do not add a
workflow platform solely for abstraction aesthetics.

## Authority

Choose the authoritative state: engine history, PostgreSQL execution record,
queue row, domain record, or an external provider. Projections and caches must be
rebuildable or reconciled from that authority.

If engine history and a database projection both appear authoritative, define
conflict resolution and recovery. “Keep them in sync” is not a contract.

## Identity

Define stable identifiers for logical workflow, run, attempt, trigger,
idempotency key, queue item, timer/wait, signal, external effect, and produced
artifact. Reuse the logical identity across retries; create a distinct attempt ID
for observability.

## Determinism and versioning

Replayable orchestration cannot depend directly on wall clock, randomness,
unordered iteration, mutable configuration, network responses, or incompatible
code paths. Use engine-provided deterministic APIs and isolate I/O.

Version workflow changes and define how existing histories continue. Test replay
of representative old histories before deployment.

## Ecosystem maturity

Temporal has a mature durable-history model with clients, workers, workflows,
activities, signals, queries/updates, timers, retries, and continue-as-new.
Inspect the exact SDK and deployment contracts.

Effect's workflow packages may be prerelease or alpha at the installed revision.
Treat authored types and adapters separately from proven runtime, persistence,
worker reachability, and recovery. Record the version boundary rather than
generalizing current behavior.
