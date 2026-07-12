# Verification matrix

## Baseline

| Change             | Minimum evidence                                               |
| ------------------ | -------------------------------------------------------------- |
| Documentation only | links/examples checked; no false commands                      |
| Internal logic     | focused tests, lint, check                                     |
| Public API         | consumer tests, docs lint, semver review                       |
| Dependency         | clean install, graph inspection, audit, tests                  |
| Workspace          | affected members, root gates, member-local execution           |
| Permission         | denied and allowed cases, task config review                   |
| Node migration     | install, scripts, build, tests, production start               |
| CLI                | help, invalid args, exit codes, stdout/stderr, signal behavior |
| Server             | request tests, timeout/abort, shutdown, readiness              |
| Bundle             | build plus runtime import/execution                            |
| Compile            | build plus clean-location binary smoke test                    |
| Desktop            | package plus target-specific launch/smoke test                 |
| Performance        | reproducible before/after benchmark plus correctness           |

## Suggested command progression

Use commands supported by the targeted Deno version and repository:

```bash
# Changed files
deno fmt --check path/to/changed.ts
deno lint path/to/changed.ts
deno check path/to/entrypoint.ts
deno test path/to/test.ts

# Affected graph
deno test --related=path/to/changed.ts
deno test --changed=origin/main

# Full gates
deno fmt --check
deno lint
deno check <all entrypoints>
deno test
deno audit
deno doc --lint <public entrypoint>
```

## Clean-room validation

For packaging, migration, and dependency work, validate outside the dirty
working tree:

- fresh clone or exported tree;
- empty dependency/cache state where practical;
- only committed files;
- production-like environment variables;
- target operating system/container;
- no undeclared local links.

## Failure reporting

When a command fails, preserve:

- exact command;
- exit code;
- concise relevant output;
- whether failure predates the change;
- likely cause supported by evidence;
- what remains unverified.

Do not quietly omit failing checks.

## Completion checklist

- [ ] Objective and acceptance criteria met.
- [ ] Project mode remains coherent.
- [ ] No invented config or API.
- [ ] Public and persisted contracts reviewed.
- [ ] Permissions are minimal and documented.
- [ ] Obsolete code/config/docs/dependencies removed.
- [ ] Formatting noise is not mixed with substantive changes.
- [ ] Focused tests pass.
- [ ] Repository gates pass or failures are reported.
- [ ] Produced artifacts were smoke-tested.
- [ ] Runtime version and unstable requirements are stated.
