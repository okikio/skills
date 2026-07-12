# Delivery playbooks

## Feature implementation

1. map the user flow and system contracts;
2. define schemas and error behavior;
3. decide module ownership;
4. implement core behavior independent of I/O where practical;
5. add adapters and entrypoint wiring;
6. add unit, integration, and artifact tests;
7. update docs and examples;
8. run focused then full verification.

## Complete refactor

1. inventory old modules, exports, consumers, tests, docs, and dependencies;
2. define invariants and final architecture;
3. separate formatting-only work;
4. implement the final modules;
5. migrate every consumer;
6. remove old modules and compatibility aliases;
7. search the entire repository for old names and paths;
8. run parity tests and repository gates;
9. document intentional behavior changes.

A refactor is not complete because a new abstraction exists. It is complete when
the old abstraction no longer participates in the product unless intentionally
retained.

## Dependency migration

1. identify every use and transitive expectation;
2. create characterization tests;
3. introduce the replacement behind the final API;
4. migrate all call sites;
5. remove old package configuration, types, and code;
6. update lockfiles;
7. run security and behavioral checks;
8. compare bundle/startup/runtime impact if relevant.

## Review

Report findings in descending impact. Avoid vague style commentary. Each finding
should answer:

```text
What concrete behavior occurs?
Why is it wrong or risky?
When does it happen?
What is the complete correction?
How can the correction be proven?
```

## Debugging

Build an evidence table:

| Dimension            | Observation                    |
| -------------------- | ------------------------------ |
| Deno version         | exact output                   |
| OS/arch              | exact target                   |
| command              | exact command and cwd          |
| manifest mode        | Deno/package/hybrid            |
| lockfile             | type and state                 |
| permissions          | exact grants                   |
| error phase          | resolve/check/runtime/artifact |
| minimal reproduction | path or command                |
| regression test      | expected behavior              |

## Architecture planning

A plan must include:

- current-state facts from direct inspection;
- target architecture and responsibility boundaries;
- alternatives compared by consistent criteria;
- ordered deliverables with files and outcomes;
- migration and cleanup steps;
- validation for every deliverable;
- rollout, rollback, and risk handling.

Do not use percentage progress as a substitute for outcomes.
