---
description: Cross-project benchmarking standards
applyTo: "**/*_bench.{js,ts,jsx,tsx},**/*bench*.{js,ts,jsx,tsx}"
---

# Benchmarking Rules

This project family uses `mitata` by default. With the option for `vitest` benchmarks when that better suits the scenario. The rules below apply to all benchmarks regardless of framework.

## Non-negotiable

Always wrap benchmark results with `do_not_optimize()`. Or an alternative that achieves the same goal.
A benchmark that does not consume its result is not trustworthy.

## Prevent constant folding and loop hoisting

Use computed parameters or generated inputs when a constant input could be hoisted or folded by the engine.
Do not benchmark the same precomputable literal in every iteration when that would let the engine optimize away meaningful work.

## GC control

Use `.gc('inner')` for allocation-heavy benchmarks.
Use `.gc('outer')` when you want lower overhead and can tolerate less stable per-iteration numbers.

## Scaling benchmarks

Prefer `.range()` for scaling tests instead of manually enumerating many `.args(...)` values when the benchmark library and scenario support it.

## Compare against baselines

Do not make performance claims without a baseline.
Benchmark against relevant alternatives, earlier implementations, or competitor libraries on the same inputs.
Keep comparison scenarios honest and aligned.

## Benchmark realistic scenarios

Do not rely only on tiny microbenchmarks.
Include representative scenarios such as:
- common-path input
- large real-world input
- pathological or adversarial input
- steady-state hot path
- end-to-end user-relevant operation

## Memory and allocation tests

Do not mix ad-hoc heap measurement inside the hot benchmark callback.
Either convert the scenario into a proper benchmark with controlled GC or move memory checks into a separate regression-focused test or benchmark file.

## Commentary and interpretation

When benchmark-driven optimization leads to less obvious code, explain the tradeoff.
State what work is being reduced, why that matters for the measured path, and why the code shape is still worth keeping.

Each benchmark should tell a small performance story: what changed, what baseline
it is compared against, what real workload it approximates, and what regression
would matter.

For lifecycle-heavy or pipeline-heavy performance work, do not overcompress the
scenario into a tiny hot-loop benchmark if the real cost comes from batching,
parsing, indexing, persistence, allocation pressure, cache behavior, or
cross-stage handoffs. Keep the benchmark focused, but make the scenario
representative enough to explain the measured path.

## Anti-patterns

- forgetting `do_not_optimize()`
- benchmarking only happy paths
- benchmarking only tiny synthetic inputs
- comparing libraries with different inputs while claiming a fair comparison
- making performance claims without a baseline
- mixing manual heap checks into benchmark callbacks
