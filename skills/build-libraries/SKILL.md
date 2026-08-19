---
name: build-libraries
description: Design, implement, refactor, review, benchmark, package, or verify reusable software libraries and SDKs. Use for public APIs, library-first or use-case-first architecture, composability, tree-shaking, ESM exports, optional integrations, arrays and iterables, async iterators, streams, batching, data-oriented design, explicit resource management, performance budgets, resumability boundaries, or extracting a reusable core from a CLI or application. Do not use for an incidental helper or an application-only internal module with no reusable consumer contract.
---

# Build libraries

A library is a programming model, not code moved into a package directory. Design
from concrete consumer call sites, domain values, workload shape, resource
ownership, and selective adoption. Keep common use cases deep and convenient
while preserving independently useful lower-level capabilities.

## Composition contract

`deliver-software` owns request authority, repository-wide implementation,
cleanup, and the final verdict. `explore-ecosystems` owns dependency topology and
source evidence. `build-devtools` owns build automation, generated artifacts,
release mechanics, and toolchain parity. `build-clis` owns command language,
configuration sources, terminal interaction, standard streams, and exit status.
`build-workflows` owns durable orchestration, workers, leases, timers, signals,
and persisted execution authority. `build-data` owns database, query, migration,
and projection contracts.

This skill owns:

- the reusable public programming model and information-hiding boundaries;
- value, data-flow, capability, policy, ecosystem, lifecycle, package, and
  operational composition;
- cardinality and flow contracts such as values, arrays, iterables, async
  iterables, streams, and explicit batches;
- public versus internal data representations and data-oriented hot paths;
- library resource acquisition, ownership, borrowing, transfer, cancellation,
  and disposal;
- ESM entrypoints, public subpaths, side-effect boundaries, optional adapters,
  and selective-adoption evidence;
- library workload budgets, benchmark stories, and resource-regression gates;
- restartable and checkpoint-resumable library contracts, while deferring
  durable workflow execution to `build-workflows`;
- migration from application-shaped abstractions to reusable capabilities.

When composed with another skill, inspect the repository once, agree on one
ownership map, and produce one integrated plan. Do not create duplicate owners
for configuration, logging, persistence, workflows, packaging, or rendering.

## Evidence preflight

Before changing a library surface, inspect:

- intended consumers, current call sites, application adapters, tests, examples,
  and published documentation;
- package manifests, exports, imports, side-effect metadata, build output,
  declaration output, and clean-consumer behavior;
- import-time work, eager registries, globals, singletons, decorators, and
  optional dependency reachability;
- request, result, failure, event, cancellation, and resource-lifetime
  contracts;
- values that are materialized, streamed, buffered, copied, retained, indexed,
  serialized, or persisted;
- concurrency, queue capacity, batch size, peak memory, CPU, latency, startup,
  cleanup, and recovery behavior;
- checkpoint, idempotency, compatibility, and versioning claims;
- application concerns accidentally embedded in reusable code, including argv,
  environment discovery, prompts, terminal rendering, process exits, and logger
  configuration.

Separate intended architecture, observed implementation, documented behavior,
published artifact behavior, and behavior proven in a clean consumer. A source
file that looks tree-shakable is not proof that the distributed package shakes.

## Core rules

1. Start from concrete use cases and desired consumer call sites. Do not extract
   the current application's execution sequence as the public architecture.
2. Organize modules around domain knowledge and design decisions likely to
   change, not generic `Runtime`, `Context`, `Stage`, or `Handler` machinery.
3. Provide a deep common-case facade and independently useful lower-level
   capabilities. Do not make consumers reconstruct the library internally.
4. Compose through explicit values, protocols, focused capabilities, policies,
   lifetimes, and ecosystem contracts. Do not reduce strategic dependencies to
   lowest-common-denominator interfaces.
5. Choose the narrowest truthful data shape. Arrays are deliberate
   materialization boundaries; iterables are lazy synchronous sequences; async
   iterables are incremental asynchronous records; streams own backpressure and
   transport semantics; batches amortize per-record overhead.
6. Model resource ownership explicitly. Prefer `Disposable`, `AsyncDisposable`,
   `using`, `await using`, and disposal stacks where the target runtime supports
   them; otherwise preserve the same ownership contract with `try/finally`.
7. Bound admission, concurrency, buffering, open resources, batch sizes, retries,
   and cleanup. An async iterator with an unbounded producer is not a bounded
   pipeline.
8. Apply data-oriented design to measured hot paths. Start from transforms,
   access patterns, volumes, locality, allocation, and lifetime. Do not replace
   readable objects with typed arrays by aesthetic preference.
9. Keep reusable modules import-safe. Importing a capability must not configure
   logging, load project configuration, launch resources, install signal
   handlers, mutate registries, or import unrelated adapters.
10. Preserve ESM and explicit public subpaths. Keep integrations physically
    separate, declare side effects truthfully, and verify selective adoption
    against built artifacts and clean consumers.
11. Name recovery guarantees precisely: restartable, checkpoint-resumable, or
    durably orchestrated. Commit checkpoints only after required outputs are
    durable and replay-safe.
12. Treat performance as a workload contract. Record absolute and relative
    results, variability, correctness oracles, peak and retained memory,
    resource counts, startup, tail latency, cleanup, and recovery where relevant.
13. Treat every public export and observable behavior as compatibility surface.
    Export only what the project is prepared to version and support.
14. Add or update evals and executable acceptance checks for every material
    library rule, public contract, packaging change, performance claim, or
    recovery claim.

## Reference routing

- [architecture.md](references/architecture.md): use-case-first design, deep
  modules, information hiding, public contracts, and application boundaries.
- [composition.md](references/composition.md): composition at every scale,
  strategic dependencies, LogTape, c12, defu, unstorage, Hookable, Optique, and
  extension ownership.
- [data-flow.md](references/data-flow.md): arrays, iterables, generators, async
  iterables, streams, batching, materialization, early termination, and
  backpressure.
- [data-oriented-design.md](references/data-oriented-design.md): transform-first
  design, hot and cold data, representation choices, allocation, locality, and
  public versus internal shapes.
- [resources-performance.md](references/resources-performance.md): explicit
  resource management, cancellation, disposal, budgets, memory, CPU, latency,
  concurrency, and representative benchmarks.
- [packaging.md](references/packaging.md): ESM, exports, subpaths, side effects,
  optional integrations, build output, tree-shaking, declarations, and clean
  consumer verification.
- [recovery-refactoring.md](references/recovery-refactoring.md): restart and
  resume guarantees, committed checkpoints, idempotency, CLI-first extraction,
  second consumers, and compatibility removal.
- [verification.md](references/verification.md): API, artifact, streaming,
  lifecycle, performance, recovery, compatibility, and cross-skill test
  matrices.

## Completion gate

Do not call library work complete until representative programmatic consumers
exercise the intended public entrypoints; imports do not perform surprising
work; unused integrations are absent from the built consumer graph; data flow is
incremental where claimed; early termination releases resources; concurrency
and buffering remain bounded; public results and failures retain their machine
contracts; package exports and declarations match; clean consumers pass; and
performance or recovery claims have executable evidence. Report blocked checks
separately from failures and never infer artifact behavior from source alone.
