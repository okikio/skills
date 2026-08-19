---
name: build-clis
description: Design, implement, refactor, review, diagnose, test, package, or release command-line applications. Use for command grammar, flags, configuration, environment sources, results and diagnostics, prompts, errors, cancellation, completion, manuals, installed artifacts, or CLI libraries, especially with Optique, LogTape, c12, defu, Standard Schema, Zod, Deno, and focused UnJS packages. Do not use for a shell one-liner or incidental script with no CLI product contract.
---

# Build command-line applications

`deliver-software` owns request authority and repository completion.
`deno-software` owns Deno manifests, tasks, permissions, compilation, and
publication. `explore-ecosystems` owns dependency topology. `build-libraries`
owns reusable programming models extracted from or consumed by the CLI. This
skill owns the CLI's public language and operational contract.

## Evidence preflight

Before changing a public CLI surface, inspect:

- nearest manifests, lockfiles, executable entrypoints, and command registry;
- tasks, permission sets, generated commands, and installed entrypoints;
- parsers, source contexts, schemas, normalization, and defaults;
- configuration discovery, precedence, provenance, and dynamic factories;
- result and diagnostic routing, renderers, redaction, and sink lifecycle;
- signal ownership, subprocesses, workers, browsers, cleanup, and exit mapping;
- help, completion, manuals, docs, examples, package contents, and acceptance
  tests.

Separate intended architecture, observed implementation, documented behavior,
and behavior actually executed. A guidebook is not proof that the repository
implements its contract.

## Public-surface trace

Classify each public term as an early control, source-bearing configuration, or
domain request input. These roles can overlap: a diagnostic or output control
may be read early for bootstrap behavior and still participate in final source
precedence. Help, version, and completion bootstrap must work before project
configuration is valid. Terms that are source-bearing traverse configuration
precedence; purely early controls and domain inputs do not automatically do so.

Trace each applicable flag, argument, environment variable, config field,
output, or error through:

```text
public name
  -> parser term
  -> sparse source value
  -> schema validation
  -> precedence and normalization
  -> handler request
  -> downstream consumer
  -> help, completion, man, and docs
  -> executable tests
```

If an arrow is missing, treat it as a defect or unresolved contract. Do not
invent the connection.

## Core rules

1. Keep handlers portable where reuse or testing justifies it. Inject process,
   terminal, filesystem, clock, environment, signal, and network capabilities.
2. Prevent structurally invalid command forms in the parser where practical.
   Validate merged-source and domain semantics in runtime schemas.
3. Preserve sparse source patches. Apply defaults after precedence resolution.
4. Give every configuration source one owner and define precedence, object,
   array, union, and operation semantics explicitly.
5. Route stable results and operational diagnostics separately. Serialize only
   after structured redaction. Durable artifacts belong to their storage owner.
6. Make prompting automation-safe. A non-interactive process must never hang.
7. Install cancellation at the composition root, propagate one signal tree,
   bound cleanup, and map signals to stable outcomes.
8. Give public error rendering one owner and failures stable exit classes.
9. Verify the installed or compiled artifact, not only in-process functions.
10. Preserve authored Markdown layout. Never run a broad formatter over CLI
    guidebooks, tables, or manuals unless the user explicitly requests it.

## Production stack doctrine

When a CLI uses Optique, c12, defu, LogTape, and Zod together, assign one owner
per boundary:

| Boundary | Owner | Failure to reject |
|---|---|---|
| Token grammar, choices, aliases, suggestions, completion, and manuals | Optique | Handwritten help or post-parse boolean reconciliation |
| Help-only default visibility | Optique document metadata | Parser defaults that materialize sparse source values |
| Project config discovery, formats, `extends`, env branches, and factories | c12 | Strict runtime validation before loader metadata is consumed |
| Recursive merge mechanics | defu behind an app merger | Public `defu(cli, env, file)` with accidental array concatenation |
| Runtime defaults, transforms, and external data contracts | Zod or another schema adapter | Defaults on sparse authoring or CLI patch schemas |
| Results, diagnostics, bootstrap errors, redaction, and sink lifecycle | LogTape at the executable boundary | `console.*`, duplicate loggers, or library-owned sink setup |

Use Optique 1.2 features when they clarify public behavior:
`negatableFlag()` for tri-state Boolean overrides, `choice()` for schema-backed
enumerations, `deferredValue()` only for handler-time fallback functions, and
`runProgram()` hooks for per-command resources such as a single resolved config
snapshot and logger. Do not use `deferredValue()` as a replacement for ordinary
schema defaults.

The defaulting rule is strict: authored config, environment, and CLI patches
stay sparse; documented defaults can appear in help; executable defaults apply
once in the complete runtime schema. Zod `.default()` is for already-valid
output defaults, `.prefault()` is for fallbacks that must pass through
transforms, and `.catch()` is error recovery rather than normal configuration.
`@optique/zod` adapts one CLI value to Zod validation; it does not transfer
multi-source precedence or runtime-default ownership to Optique.

Record provenance while resolving source layers. Do not reconstruct it from the
final value: an explicit CLI value can equal the inherited config value and must
still remain the winner. Version and redact the provenance envelope before
rendering it or passing it through LogTape.

Load dynamic project configuration once per invocation. If Optique source
contexts need a c12 snapshot and the handler also needs final config, thread
that snapshot through `runProgram()` hooks or an equivalent composition-root
resource. Do not let handlers call the full resolver again.

## Reference routing

- [audit.md](references/audit.md): repository audit, observed-versus-promised
  behavior, and end-to-end tracing.
- [architecture.md](references/architecture.md): portable core, adapters,
  capability boundaries, and composition choices.
- [commands.md](references/commands.md): command grammar, Optique, schemas,
  help, completion, manuals, aliases, and deprecation.
- [optique.md](references/optique.md): complete Optique package map, typed
  grammar, source contexts, schema, prompt, logging, time, Git, discovery,
  completion, manual, and runner integration patterns.
- [five-library-stack.md](references/five-library-stack.md): load when Optique,
  c12, defu, LogTape, and Zod interact; includes source-flow maps,
  wrong/right examples, default taxonomy, one-snapshot execution, and test
  matrix.
- [defaults-provenance.md](references/defaults-provenance.md): detailed
  three-schema model, `@optique/zod`, `.default()` versus `.prefault()`, nested
  defaults, source resolution, field decisions, provenance envelopes, and
  implementation tests.
- [config.md](references/config.md): c12/defu, authored and runtime shapes,
  precedence, arrays, atomic unions, operations, and provenance.
- [c12-defu.md](references/c12-defu.md): detailed c12, defu, and jiti loading
  lifecycle, merge algebra, dynamic factories, extension layers, provenance,
  mutation, version boundaries, tests, and failure diagnosis.
- [output.md](references/output.md): LogTape results, diagnostics, artifacts,
  redaction, renderers, sinks, and lifecycle.
- [logtape.md](references/logtape.md): complete LogTape category, sink, filter,
  formatter, context, redaction, testing, bootstrap, and disposal manual.
- [interaction.md](references/interaction.md): no-argument behavior, prompts,
  streams, secrets, TTYs, paging, progress, risk, and recovery.
- [lifecycle.md](references/lifecycle.md): cancellation, resources,
  checkpoints, reconciliation, exit status, and error ownership.
- [testing.md](references/testing.md): layered, subprocess, generated-surface,
  cancellation, packaging, and clean-machine verification.
- [benchmarking.md](references/benchmarking.md): correctness-gated mitata and
  installed-artifact benchmarks for parsing, config loading, merging, Zod,
  provenance, LogTape, startup, memory, and regression reporting.
- [distribution.md](references/distribution.md): manifests, compiled assets,
  package contents, installation, upgrade, and uninstall.
- [ecosystems.md](references/ecosystems.md): capability map for Optique,
  LogTape, c12/defu, schema tools, prompts, Temporal, and UnJS companions.
- [unjs.md](references/unjs.md): focused UnJS capability map, ownership
  boundaries, package combinations, exclusions, and integration sequences.
- [unjs-runtime-config.md](references/unjs-runtime-config.md): load for jiti,
  c12, defu, destr, confbox, pkg-types, pathe, or ufo implementation.
- [unjs-fetch-state.md](references/unjs-fetch-state.md): load for ofetch,
  unstorage, ohash, or Hookable implementation and version boundaries.
- [unjs-build-release.md](references/unjs-build-release.md): load for unbuild,
  nypm, Magicast, giget, changelogen, automd, rc9, or std-env implementation.
- [integration.md](references/integration.md): worked end-to-end sequences that
  join parsing, source resolution, logging, execution, recovery, and release.
- [casebook.md](references/casebook.md): load for codebase-grounded Kaiju
  traces and portable CLI policy maps covering command-language governance,
  human versus machine output, dangerous-operation plans, standard streams,
  secrets, paging, consentful config edits, telemetry, root program resources,
  sparse adapters, config/provenance, browser/Common Crawl/WARC/domains flows,
  stage/artifact boundaries, lifecycle/concurrency, field-extension checklists,
  failure signatures, and behavior-to-test matrices.

## Completion gate

Do not call CLI work complete until the real invocation path has been exercised
for success, invalid input, operational failure, and cancellation as applicable;
stdout, stderr, exit status, and artifacts match their contracts; generated
surfaces agree; and the packaged or compiled entrypoint runs in a clean context.
Report blocked checks separately from failed checks. If the change makes a
performance claim, run a named representative benchmark against a recorded
baseline and report absolute change, relative change, variability, and semantic
oracles.
