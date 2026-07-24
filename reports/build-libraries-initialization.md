# Build Libraries skill initialization

## Scope

This change adds a focused `build-libraries` skill for designing, extracting,
reviewing, packaging, and verifying reusable TypeScript and JavaScript
libraries. It is intentionally separate from CLI interface design, generic
delivery policy, developer-tool packaging automation, ecosystem research, data
platform design, and durable workflow execution.

The skill incorporates the library-first architecture guidebook and the attached
decision-justification guidance. It treats “library first,” “composable,”
“streaming,” and “tree-shakable” as claims that require a concrete objective,
constraints, alternatives, trade-offs, and executable evidence.

## Accepted skill surface

The skill routes eight material references:

1. use-case-first architecture, information hiding, deep modules, and qualified
   boundary decisions;
2. composition across values, data flow, capabilities, policies, ecosystems,
   lifecycles, package graphs, and operations;
3. values, arrays, iterables, generators, async iterables, streams, batching,
   materialization, backpressure, cancellation, and early termination;
4. transform-first data-oriented design, hot and cold data, indexing,
   allocation, locality, and public-to-internal representation boundaries;
5. explicit resource ownership, `Disposable`, `AsyncDisposable`, `using`,
   `await using`, partial-construction cleanup, concurrency, buffering, and
   performance budgets;
6. ESM exports, public subpaths, side-effect metadata, adapter isolation,
   declaration reachability, clean consumers, and tree-shaking evidence;
7. restartable, checkpoint-resumable, and durably orchestrated execution plus a
   phased CLI-first extraction process;
8. source, artifact, runtime, lifecycle, workload, recovery, compatibility, and
   cross-skill verification.

## Ecosystem position

The skill preserves strategic ecosystem semantics instead of wrapping every
package behind a lowest-common-denominator interface:

- LogTape supplies structured library diagnostics, categories, contexts,
  filters, sinks, redaction, and lifecycle behavior. Applications configure the
  logging graph.
- c12 discovers and resolves configuration layers. defu may participate in an
  application-owned merge algebra. Libraries receive validated resolved values.
- unstorage supplies selectable storage drivers, but the library contract states
  the actual durability, atomicity, and checkpoint semantics required.
- Hookable is reserved for real extension protocols rather than internal code
  organization.
- Optique remains owned by `build-clis` as the executable command-language
  adapter.

## Ownership boundaries

Routing changes establish these boundaries:

- `deliver-software` selects `build-libraries` for library, SDK, extraction,
  public API, tree-shaking, streaming, resource-lifetime, performance, and
  resumability work.
- `build-clis` owns argv, help, interaction, configuration sources, terminal
  output, process signals, and exits. It does not own the reusable programming
  model.
- `build-devtools` owns build, package, release, and generated developer-tool
  surfaces. `build-libraries` owns the meaning of the public API and selective
  adoption contract.
- `build-workflows` owns persisted execution authority, worker reachability,
  retries, timers, signals, and operator recovery. `build-libraries` owns
  restartable and checkpoint-resumable operation contracts that may be hosted by
  that workflow layer.
- `explore-ecosystems` remains the owner for broad package-family topology and
  package selection research.

## Evaluation surface

`evals/cases/library-design-deep.json` contains 34 cases:

- 8 train;
- 8 valid-seen;
- 6 valid-unseen;
- 7 adversarial;
- 2 transfer;
- 3 test-frozen.

The cases include 29 direct `build-libraries` cases and 5 cross-skill
composition cases. Eight capability records connect every material reference to
its sources, decision questions, failure signatures, exclusions, and
verification method.

The held-out decision case requires an architecture recommendation to expose its
objective, hard constraints, diagnosis, alternatives, rejection reasons,
trade-offs, assumptions, defeaters, and qualified decision classification. It
prevents package proliferation from being justified by “library first” alone.

## Executable frozen fixtures

### Selective adoption

`evals/fixtures/library-selective-adoption` begins with an intentionally broken
package whose root entrypoint eagerly reaches a browser adapter and whose module
mutates global state. The oracle requires:

- ESM package identity;
- root, core, and browser public subpaths;
- truthful `sideEffects: false` metadata;
- core and root imports that do not load the browser adapter;
- explicit browser import without global mutation.

### Streaming cleanup

`evals/fixtures/library-streaming-cleanup` begins with an intentionally eager
`Promise<Array>` implementation. The oracle requires:

- lazy resource acquisition;
- an `AsyncIterable` result;
- one read per consumed value;
- upstream stop after early termination;
- exactly-once asynchronous disposal;
- disposal after failure.

Both fixtures reject their broken state and pass after their expected fixes are
applied in temporary copies.

## Verification completed

The following checks were actually run:

- JSON parsing for the new case corpus, capability registry, and source registry;
- custom repository validation equivalent to the deterministic structural rules
  in `scripts/validate.ts`;
- custom SkillOpt matrix validation for reference coverage, root routing, and
  frozen composition topology;
- Node syntax checks for all new `.mjs` fixture files;
- broken-state oracle checks for both executable fixtures;
- corrected-state oracle checks in temporary copies for both fixtures;
- SHA-256 verification for the library-first guidebook and attached
  decision-justification source;
- trailing whitespace, final newline, CRLF, and em-dash checks across all changed
  files;
- generated-state checks for `.skillopt`, Python caches, and macOS metadata.

The structural validator reported:

```text
Checked 13 skills, 544 cases, 16 executable, 52 frozen,
80 capabilities, 70 sources.
Custom repository validation passed.
```

The matrix validator reported:

```text
Matrix checked 54 capability references, 13 root routers,
and 3 frozen composition topologies.
Custom SkillOpt matrix validation passed.
```

## Blocked or not run

- The environment does not contain a Deno executable. Network restrictions also
  prevented installing one. Therefore `deno task check`, `deno task test`,
  `deno task validate`, and `deno task skillopt:matrix` were not run through the
  repository's native Deno task chain.
- Full `sources:verify` was not run because it requires the complete historical
  attachment directory. The two newly registered local source digests were
  verified directly.
- External model rollouts, LLM judging, cross-model evaluation, and SkillOpt
  optimization were not available. No model-quality improvement is claimed.

These are release blockers for a final optimized skill release, but not hidden
as successful checks in this handoff.
