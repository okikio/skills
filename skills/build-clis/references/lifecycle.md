# Lifecycle, cancellation, and failures

## Signal ownership

Create the root `AbortController` at the executable composition root. Install
runtime signal handlers there and pass the signal to handlers, HTTP requests,
subprocesses, workers, browser sessions, queues, and cleanup registrations.

An `AbortSignal` parameter somewhere in the call graph is not proof of working
cancellation. Trace the concrete signal from process handler to active work and
verify it in a subprocess.

Define:

- first interrupt: cooperative abort and bounded cleanup;
- second interrupt: force termination if cleanup stalls;
- cleanup ordering and deadline;
- worker/browser/subprocess termination;
- logger flush/reset;
- stable interrupt exit, normally 130 for SIGINT where the host supports it.

## Public failure ownership

Handlers should return or throw structured failures. One boundary renders the
public error and selects the exit class. Do not log a public error in a handler,
rethrow it, and log it again at the entrypoint.

Keep distinct outcomes for invalid usage/configuration, conflict, unavailable
dependency or network, permission, cancellation, and internal defect. Stable
automation depends on more than “nonzero.”

## Resume and checkpoints

For long work, a checkpoint represents committed work, not attempted work.
Record versioned input identity, stage, offset or key, output identity, and
enough provenance to reject incompatible resume attempts.

Make effects idempotent or deduplicated. After a crash, reconcile external work,
local state, and checkpoints before retrying. Compose with `build-workflows` when
timers, replay, signals, leases, or cross-process recovery are material.

## Resource lifetime

Every opened resource needs an owner and close path: database clients, files,
temporary directories, HTTP servers, sockets, browser sessions, workers,
subprocesses, timers, observers, and logger sinks. Test success, failure,
cancellation, and partial initialization.
