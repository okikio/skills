---
name: build-clis
description: Design, implement, refactor, review, diagnose, test, package, or release command-line applications. Use for command grammar, flags, configuration, environment sources, results and diagnostics, prompts, errors, cancellation, completion, manuals, installed artifacts, or CLI libraries, especially with Optique, LogTape, c12, defu, Standard Schema, Zod, Deno, and focused UnJS packages. Do not use for a shell one-liner or incidental script with no CLI product contract.
---

# Build command-line applications

`deliver-software` owns request authority and repository completion.
`deno-software` owns Deno manifests, tasks, permissions, compilation, and
publication. `explore-ecosystems` owns dependency topology. This skill owns the
CLI's public language and operational contract.

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

## Reference routing

- [audit.md](references/audit.md): repository audit, observed-versus-promised
  behavior, and end-to-end tracing.
- [architecture.md](references/architecture.md): portable core, adapters,
  capability boundaries, and composition choices.
- [commands.md](references/commands.md): command grammar, Optique, schemas,
  help, completion, manuals, aliases, and deprecation.
- [config.md](references/config.md): c12/defu, authored and runtime shapes,
  precedence, arrays, atomic unions, operations, and provenance.
- [output.md](references/output.md): LogTape results, diagnostics, artifacts,
  redaction, renderers, sinks, and lifecycle.
- [interaction.md](references/interaction.md): no-argument behavior, prompts,
  streams, secrets, TTYs, paging, progress, risk, and recovery.
- [lifecycle.md](references/lifecycle.md): cancellation, resources,
  checkpoints, reconciliation, exit status, and error ownership.
- [testing.md](references/testing.md): layered, subprocess, generated-surface,
  cancellation, packaging, and clean-machine verification.
- [distribution.md](references/distribution.md): manifests, compiled assets,
  package contents, installation, upgrade, and uninstall.
- [ecosystems.md](references/ecosystems.md): capability map for Optique,
  LogTape, c12/defu, schema tools, prompts, Temporal, and UnJS companions.
- [casebook.md](references/casebook.md): worked patterns and failures grounded
  in the attached Kaiju CLI repository.

## Completion gate

Do not call CLI work complete until the real invocation path has been exercised
for success, invalid input, operational failure, and cancellation as applicable;
stdout, stderr, exit status, and artifacts match their contracts; generated
surfaces agree; and the packaged or compiled entrypoint runs in a clean context.
Report blocked checks separately from failed checks.
