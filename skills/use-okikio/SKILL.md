---
name: use-okikio
description: Research, select, integrate, review, or debug Okikio-maintained libraries and recurring project patterns without inventing private APIs. Use for @okikio/undent, @okikio/wikitext, @okikio/sparql, @okikio/observables, @okikio/opfs and related storage work, RDF/SPARQL architecture, backend endpoint/query/response/database utilities, service modules, workflow/control-plane utilities, MediaD-style utils/packages architecture, package generation, and related personal repositories.
---

# Use Okikio libraries and patterns

Okikio projects evolve quickly and several have documented target architectures
that are ahead of published packages. Treat every remembered package, export, or
pattern as a hypothesis until current source and tests prove it.

This skill owns exact personal-library knowledge and recurring project patterns.
It does not replace the API, library, data, workflow, CLI, web, or delivery skill
that owns the implementation domain.

## Package status gate

Classify the exact target before writing usage code:

- **published and verified:** current version/export exists and tests or a clean
  consumer exercise it;
- **local/private and inspectable:** source exists in the supplied/current
  repository but publication is not claimed;
- **experimental:** prerelease/`0.0.x`, prototype, or incomplete surface;
- **documented target:** design/handoff describes behavior not yet implemented;
- **historical:** old code or handoff retained as evidence;
- **remembered only:** no current source evidence.

Use this authority order for an API claim:

1. current export map/public entrypoint;
2. executable tests and real consumers;
3. package manifest/version and built artifacts;
4. current implementation;
5. README/API docs;
6. design handoffs and plans;
7. archived repositories and memory.

Do not claim availability above the strongest evidence.

## Recurring current conventions

When the inspected repository does not define a more specific rule, recent
Okikio work strongly tends toward:

- one-word-first concrete names;
- short operations intended for coherent namespace imports;
- `get` for addressable retrieval and `read` for actual/sequential reading;
- Zod `*Schema` constants and schema-derived project `*Type` data;
- behavior interfaces/classes named after the domain concept;
- direct schema/type imports rather than namespace hiding;
- Standard Schema at validator-neutral integration seams;
- Deno-first strict ESM with explicit file extensions and the same core source
  shared across Deno/Node/Bun/browser when claimed;
- generic execution mechanics in `utils/`, concrete capabilities in `packages/`,
  declarative definitions in `registry/`, executable composition in `clis/` or
  `apps/`;
- borrowed injected resources unless ownership transfer is explicit;
- `AbortSignal` cancellation distinct from disposal/cleanup;
- `AsyncDisposable`/disposal stacks where they improve ownership;
- LogTape categories in reusable packages while applications own configuration;
- `node:test` + `@std/expect` as the common portable test style, plus actual
  runtime-specific validation for every claimed runtime;
- Mitata for selected cross-runtime benchmarks and Playwright for real browser
  capability tests;
- extensive TSDoc/comments for important internal state, schemas, fields,
  parser tables, regular expressions, resource factories, caches, generations,
  leases, retry rules, and cleanup paths;
- replacement of obsolete internal compatibility unless the requirement says to
  preserve it.

These are conventions, not proof of a specific package export. Verify the
repository before applying them.

## Procedure

1. Resolve exact spelling, repository/workspace, version, export path, runtime,
   license, maturity, and current consumers.
2. Inspect sibling packages and related repositories only far enough to find the
   correct capability owner. Do not install the whole personal ecosystem.
3. Trace the public API from exports through implementation and tests. Label
   unexported helpers and target-design documents honestly.
4. Compare the consuming repository's schema, logging, configuration, resource,
   task/workflow, and packaging owners. Reuse the Okikio pattern only when the
   contracts align.
5. Preserve caller ownership of injected resources unless an explicit option
   transfers it. Trace cancellation, disposal, partial construction, and cleanup
   errors.
6. For parsers/data-oriented code, identify the cost ladder: bytes/text ->
   tokens/events -> retained model/tree -> higher-level findings. Do not
   materialize the expensive representation when a lower layer answers the
   question.
7. For OPFS/storage work, keep client/driver/adapter/filesystem/bridge concepts
   distinct when the repository uses that model. Capabilities, limits,
   partitioning, metrics, lifecycle, and provider semantics stay inspectable.
8. For RDF/SPARQL work, separate core data model/serialization/query building
   from optional engines and adapters. Do not make a comparison library a runtime
   dependency unless it is intentionally an adapter.
9. If source is unavailable, state the exact inspection needed. Provide an
   integration/discovery plan, not invented imports.

## Failure review

Watch for:

- documented symbol absent from the current public export;
- old handoff used as evidence of implemented behavior;
- generated package API inferred from generator source without inspecting output;
- prototype workflow/adapter presented as durable production implementation;
- observable/event API accidentally treated as cancellation or persistence
  authority;
- library configuring application LogTape globally;
- parser tree/model built when event/range scan was sufficient;
- storage adapter disposing caller-owned database/storage;
- claimed cross-runtime support proven only by TypeScript;
- benchmark comparing different semantics or omitting cleanup/startup cost.

## Verification

For a public Okikio integration, verify at the strongest available level:

1. exact import/export and type inference;
2. source/test contract;
3. representative behavior including failure and cleanup;
4. package/build artifact when publication matters;
5. real claimed runtimes;
6. benchmark or conformance suite when performance/standard compliance matters.

## Reference routing

- [packages.md](references/packages.md): package identity, evidence classes,
  publication/generation protocol, dual-release behavior, and unresolved targets.
- [undent.md](references/undent.md): dedentation, interpolation, newline and
  Unicode display-width behavior.
- [wikitext.md](references/wikitext.md): data-oriented token/event/tree cost
  ladder, source spans, malformed input, sessions, and maturity limits.
- [observables.md](references/observables.md): published Observable/operators,
  error modes, EventBus, pull/backpressure, teardown, and interop.
- [sparql.md](references/sparql.md): query/value/expression construction,
  execution seam, safe mapping, federation/security, and engine differences.
- [backend.md](references/backend.md): service modules, endpoint/validation/query/
  response/database/auth/server patterns and current limitations.
- [opfs.md](references/opfs.md): OPFS/storage clients, drivers, adapters, filesystem
  semantics, bridges, capabilities, limits, partitioning, and lifecycle.
- [mediad.md](references/mediad.md): MediaD library-first package ownership, media
  cost ladders, task lifecycle, streaming parsers, HLS/DASH, and verification.
- [rdf.md](references/rdf.md): RDF/SPARQL standards packages, streaming parsers,
  stores, conformance, differential tests, and benchmark rules.
- [workflows.md](references/workflows.md): workflow/control-plane definitions,
  stores, workers, waits/signals, Effect adapters, and known durability gaps.

Compose with the skill that owns the actual change. This skill supplies verified
personal-library context; it does not override repository-local architecture or
claim unimplemented plans as real APIs.

## Completion gate

Do not call an Okikio-library integration complete until the exact current API
was verified, the consuming repository's ownership/lifecycle model remains
coherent, important failure and runtime paths were tested, and any package or
performance claim was checked against the relevant built artifact or benchmark.
