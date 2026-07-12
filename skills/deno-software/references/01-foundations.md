# Deno foundations

## Contents

- Deno is an integrated JavaScript system
- Runtime API selection
- TypeScript
- Side effects and entrypoints
- Cancellation and cleanup
- Errors
- Configuration
- Minimum runtime

## Deno is an integrated JavaScript system

Treat Deno as a runtime, package manager, task runner, formatter, linter, type
checker, test runner, benchmark runner, documentation generator, dependency
inspector, auditor, bundler, compiler, and deployment interface. The benefit is
coherent defaults and fewer contracts between unrelated tools. The risk is
assuming a built-in tool is automatically the best fit for every established
repository.

Use the integrated toolchain when it satisfies the repository's functional and
ecosystem requirements. Preserve mature external tooling when replacement would
lose capability, compatibility, or contributor familiarity without a measurable
gain.

## Runtime API selection

Prefer the contract that best matches the problem:

- **Web APIs** for portable primitives such as `fetch`, `Request`, `Response`,
  streams, URL handling, crypto, abort signals, events, and web sockets.
- **Deno APIs** for runtime-specific concerns such as permissions, serving,
  filesystem helpers, subprocesses, environment access, KV, or runtime metadata.
- **Node APIs** when consuming Node libraries, matching Node semantics, or
  integrating with Node-oriented tooling.

Do not replace a clear web API with a Deno-specific API merely to look
Deno-native. Do not wrap Node APIs unnecessarily when their semantics are the
ecosystem contract.

## TypeScript

Default to:

- strict type checking;
- ESM;
- explicit local file extensions;
- JavaScript-native TypeScript syntax;
- no generated JavaScript committed unless the artifact requires it;
- schemas/codecs as the source of truth for external and persisted data.

Avoid compiler-only syntax that introduces runtime transformations unless the
project already depends on it and the target tooling supports it.

## Side effects and entrypoints

Keep reusable modules import-safe:

- no server startup on import;
- no unconditional process exit;
- no environment reads hidden in module initialization when dependency injection
  is practical;
- no filesystem or network operations merely from importing a library;
- no global mutable singleton unless its lifecycle is explicit.

Use a thin entrypoint:

```ts
import { main } from "./app.ts";

if (import.meta.main) {
  await main(Deno.args);
}
```

## Cancellation and cleanup

Use `AbortSignal` for operations that can block or outlive a request. Propagate
the same signal through fetches, streams, database calls, and child processes
when supported.

Close resources deterministically. Use `using` and `await using` for disposable
resources where the API supports `Symbol.dispose` or `Symbol.asyncDispose`;
otherwise use `try/finally`.

## Errors

Errors should preserve causal information and operational context:

- use `cause` when wrapping;
- separate expected domain errors from programming defects;
- do not stringify and lose stacks prematurely;
- map errors to exit codes or HTTP responses at the system edge;
- keep secrets, tokens, full connection strings, and sensitive payloads out of
  logs.

## Configuration

Read configuration once at the application boundary, validate it, and pass an
immutable configuration object inward. Avoid scattered `Deno.env.get()` calls.

For data-bearing configuration, define a Zod v4 schema and infer the TypeScript
type.

## Minimum runtime

A project must state its minimum supported Deno version when it uses
version-specific behavior. Pin exact versions in CI for reproducibility; test
the minimum version and optionally latest stable when maintaining a
compatibility range.
