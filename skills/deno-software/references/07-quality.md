# Testing, checking, CI, and benchmarks

## Quality layers

A complete Deno quality strategy separates:

1. formatting;
2. linting;
3. type checking;
4. unit tests;
5. integration tests;
6. contract tests;
7. end-to-end or artifact tests;
8. documentation and export checks;
9. security audit;
10. benchmarks where performance is a requirement.

## Test design

Use `Deno.test` by default for a new Deno-native project. Keep tests
deterministic, isolated, and explicit about permissions.

Use:

- table-driven/parameterized cases for input matrices;
- snapshots for stable structured output, not opaque business logic;
- setup/teardown for lifecycle ownership;
- fake time or injected clocks for temporal behavior;
- temporary directories for filesystem isolation;
- local in-process servers for network behavior;
- property tests when invariants matter more than examples.

Retries reveal flaky tests. They do not repair nondeterminism. Repeated runs are
useful to prove stability after fixing races or cleanup defects.

## Affected test selection

Use change-aware selection for local feedback and appropriately scoped CI. Run
the full suite when manifests, configuration, lockfiles, shared test
infrastructure, or broad workspace contracts changed.

## Coverage

Coverage thresholds are guardrails, not a design target. Require meaningful
assertions around critical branches, failures, and boundaries. Avoid tests that
execute lines without validating behavior.

## Type checking

Check public entrypoints and package roots, not only whichever files tests
happen to import. For workspaces, check every publishable package entrypoint.

## Documentation

Run documentation validation for public libraries. Public exported symbols
should have useful docs where names and types do not fully explain behavior,
errors, permissions, side effects, or examples.

## CI

Pin the Deno version. Cache only when keys include relevant lockfiles and
configuration. Use `deno fmt --check`, never mutating formatting in CI.

A typical sequence:

```bash
deno fmt --check
deno lint
deno check <entrypoints>
deno test --coverage=coverage
deno coverage coverage
deno audit
deno doc --lint <public-entrypoint>
```

Adapt to repository tasks and supported command syntax.

## Benchmarks

Use `deno bench` or a justified external harness. Record:

- hardware, OS, architecture, Deno version;
- warmup and sample strategy;
- dataset size and concurrency;
- before and after distributions;
- memory when relevant;
- correctness checks;
- variance and likely confounders.

Do not compare unlike builds, different dependency graphs, or different runtime
flags.
