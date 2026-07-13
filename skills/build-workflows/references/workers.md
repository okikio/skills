# Workers, queues, timers, waits, and signals

## Queue claims and leases

Claim work atomically. Use database locking such as `FOR UPDATE SKIP LOCKED`, an
atomic update with returned rows, or the queue engine's claim primitive. A plain
read followed by conditional update can race.

Store lease owner, expiry, attempt, heartbeat, and last error. Recover expired
leases without duplicating a non-idempotent effect.

## Retry and poison work

Define retryable failure classes, attempt limit, exponential/backoff policy,
jitter, timeout, and budget. Separate permanent invalid input from transient
unavailability. Move poison work to a visible terminal/dead-letter state with an
inspect and replay procedure.

## Timers, waits, and signals

Persist timer/wait identity and resolution status. Make timeout, signal, and
cancellation race-safe. Resolving a wait, appending its timeline event, and
enqueueing resume must be atomic or repairable.

Deduplicate signals and define buffering for signals that arrive before the
workflow waits. Validate signal payloads and authorization.

## Schedules and backpressure

Specify missed-run, overlap, catch-up, timezone, daylight-saving, and clock-skew
behavior. Bound queue depth, worker concurrency, per-tenant fairness, downstream
rate, and memory. Admission and worker limits must not contradict each other.

## Worker lifecycle

Prove boot, health, graceful drain, cancellation, active lease handling, logger
flush, and deployment reachability. A worker package not started by deployment
is not an implemented workflow capability.
