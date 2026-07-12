# CLIs, servers, bundles, binaries, and desktop apps

## Scripts

Use direct source execution for internal automation when distribution does not
require a packaged artifact. Give scripts narrow permissions, validated
arguments, clear exit codes, and idempotent behavior where possible.

## CLIs

Structure:

```text
cli entrypoint
  parse arguments
  configure logging
  load validated configuration
  invoke application commands
  map result/errors to output and exit code
application modules
  reusable behavior
adapters
  filesystem, network, process, database
```

Test stdout and stderr separately, exit codes, signals, invalid input, help,
version output, non-interactive behavior, and installation/execution paths.

## Servers

A production server needs:

- explicit host/port configuration;
- request limits and timeouts;
- cancellation propagation;
- structured errors;
- graceful shutdown;
- readiness and liveness behavior;
- logging and telemetry;
- least-privilege permissions;
- production dependency lifecycle;
- tests for aborted requests and shutdown.

Do not hide server startup in an imported module.

## Bundles

Use a bundle when the consumer needs JavaScript or browser-oriented output
rather than a runtime executable. Validate sourcemaps, asset handling, external
dependencies, module format, and target runtime.

## Compiled executables

Use compilation when the consumer benefits from a standalone binary. Confirm:

- target triples;
- dynamic libraries and native dependencies;
- embedded files and runtime paths;
- permissions baked into or requested by the artifact;
- environment requirements;
- startup/shutdown and signals;
- cross-compiled artifact behavior;
- signing/notarization/installer needs.

Run the produced binary in a clean location.

## Desktop

`deno desktop` in Deno 2.9 is experimental. Isolate it behind a small
adapter/entrypoint, pin Deno, and avoid making core domain logic depend on
unstable desktop APIs.

Decide between system webview and bundled browser backends based on:

- rendering consistency;
- binary size;
- startup time;
- platform feature requirements;
- update and security patch model.

Test packaging, native dialogs, bindings, window lifecycle, auto-update policy,
file access, and each supported target.

## Containers and deployment

Use a pinned runtime image/version. Copy manifests and lockfiles before source
when optimizing install layers. Run as a non-root user where possible. Define
health checks and graceful stop behavior. Do not grant container capabilities
merely to compensate for application permission mistakes.
