# Control plane and reachability

## Control-plane responsibilities

A control plane can own definition registration, trigger normalization,
deterministic IDs, admission policies, execution records, timelines, queueing,
signals, cancellation, schedules, and operator APIs. Keep domain workflow code
separate from runtime/worker bootstrap.

## Reachability trace

```text
definition
  -> registry
  -> control-plane start
  -> durable execution and timeline
  -> queue or engine submission
  -> reachable worker
  -> runtime adapter
  -> effect and result
  -> public status/inspection path
```

Trace the active HTTP/CLI path. A new control plane can coexist with legacy
handlers that never call it. A worker loop named `dispatch` can still be a
`return 0` scaffold.

## Admission policies

Define atomic behavior for idempotency, concurrency limits, throttle, rate limit,
debounce, batch, singleton, and cancellation. State whether the policy applies to
logical runs, attempts, tenants, workflow types, or resources.

Do not implement admission as a read followed by an unconstrained insert. Back
it with uniqueness, locking, or an atomic engine primitive.

## Timeline and projections

Append immutable, ordered events with actor, cause, timestamp, version, and
correlation. Derive mutable status projections deliberately. Sequence allocation
must remain unique under concurrency; `existing.length + 1` is not safe.

Expose enough data for an operator to distinguish queued, leased, running,
waiting, retrying, cancelling, completed, failed, timed out, and orphaned work.
