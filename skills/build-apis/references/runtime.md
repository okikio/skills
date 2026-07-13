# Runtime, middleware, and resources

## Runtime adapters

Hono portability does not imply every runtime adapter, middleware package, RPC
client, validator, streaming mode, websocket path, or OpenAPI integration has
identical behavior. Inspect the selected host and deployed entrypoint.

## Resource ownership

Construct long-lived database pools, auth instances, HTTP clients, logger sinks,
and workflow clients once at the host composition root. Adapt them into request
context without recreating them per request. Expose shutdown and drain behavior.

Avoid import-time configuration and logs. Importing a module should be safe in
tests, code generation, and tooling without production environment values.

## Defaults and security

Do not call a default “production optimized” while enabling wildcard CORS,
pretty JSON, verbose diagnostics, or development middleware. Defaults must be
explicitly justified by deployment and threat model.

## Error boundary

One root boundary owns unexpected failure logging, correlation ID, safe problem
mapping, and response completion. Handlers should not log a public failure and
then rethrow it into a second public log.

## Operational verification

Run concurrent requests, cancellation/disconnect, graceful shutdown, pool
exhaustion, provider timeout, malformed response, and middleware exception tests.
Assert resources close and every public failure has one correlated diagnostic.
