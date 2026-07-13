# CLI architecture

## Choose proportionally

| Situation | Appropriate shape |
|---|---|
| Small, single-runtime internal command | One executable module with explicit boundaries |
| Reusable operations and a CLI | Portable handlers plus one host adapter |
| Deno and Node entrypoints | Shared domain core plus runtime-specific composition roots |
| Browser/worker reuse | Capability-injected core with no process globals |
| Long-running/durable work | Thin CLI client over a durable engine or control plane |

Do not mandate package splits that the repository does not need. Architectural
boundaries can exist as modules before they become packages.

## Portable core

Handlers should receive validated requests and explicit capabilities. Useful
capabilities include:

- filesystem and paths;
- environment and clock;
- terminal characteristics and input;
- result and diagnostic emitters;
- HTTP, subprocess, browser, and worker factories;
- cancellation and cleanup registration;
- durable store, queue, or workflow client.

Host adapters own runtime globals such as `Deno.args`, `process.argv`, TTY probes,
signals, and permission prompts. Keep import-time execution out of portable
modules.

## Ownership boundaries

- Parser owns token grammar, spelling, aliases, suggestions, help metadata, and
  structurally exclusive forms.
- Source adapters own sparse values from CLI, environment, and files.
- Schemas own runtime validation and normalized domain shapes.
- Resolver owns precedence, merge semantics, defaults, and provenance.
- Handler owns use-case orchestration, not process rendering.
- Log transport owns observable results and diagnostics.
- Artifact writers own durable files, checkpoints, databases, and exports.
- Composition root owns capabilities, signals, logger lifecycle, and exits.

One module may implement several owners in a small CLI, but the contracts must
remain distinguishable and testable.

## Long-running commands

When a command launches durable work, decide whether the CLI:

- waits and streams status;
- starts work and returns a stable run identifier;
- attaches to an existing run;
- polls or subscribes;
- supports cancel, retry, resume, and inspect.

Do not call an in-memory chain durable. Compose with `build-workflows` for
persistence, replay, idempotency, and operator recovery.
