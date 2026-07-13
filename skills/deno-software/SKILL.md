---
name: deno-software
description: Deliver complete Deno 2 software. Use for Deno repositories, deno.json or deno.jsonc, Deno workspaces, JSR packages, Node projects adopting Deno, CLIs, servers, libraries, scripts, compiled binaries, desktop apps, migrations, refactors, reviews, debugging, testing, benchmarking, publishing, CI, security, permissions, dependency management, and architecture decisions. Inspects the repository first, chooses the correct Deno/package mode, implements the whole change, removes obsolete paths, and validates behavior with current Deno tooling.
license: MIT
metadata:
  author: Okiki Ojo
  based_on:
    - denoland/skills
    - deliver-software
  knowledge_baseline: Deno 2.0 through 2.9
  version: "2.1.0"
  last_reviewed: "2026-07-10"
---

# Deno Software

## Relationship to general delivery skills

This skill owns Deno-specific contracts. When deliver-software is also
available, let it own the general delivery lifecycle. Apply this skill as the
Deno specialization and do not repeat discovery, planning, cleanup, validation,
verification, or reporting stages. When used alone, retain the complete
workflow by loading
[the standalone fallback](references/16-standalone.md).

Deliver working software, not Deno-flavoured snippets.

This skill combines current Deno knowledge with a complete software-delivery
workflow. It must reason from the repository in front of it, preserve the
project's valid constraints, choose between Deno-native and Node-compatible
approaches deliberately, complete the requested change, remove superseded code,
and prove the result.

## Required references

For ambiguous or high-risk decisions, read
[decision cases](references/15-decision-cases.md).

Read only the references needed for the task. Always read
`references/01-foundations.md` and `references/03-repository-discovery.md`
for substantive repository work. Read release history only when version
availability, stability, migration timing, or a recently changed contract could
affect the decision.

When `deliver-software` owns the lifecycle, use repository discovery as the Deno
evidence checklist inside the shared discovery pass. Do not perform or report a
second discovery, plan, or completion workflow.

| Task                                    | Required references                                                 |
| --------------------------------------- | ------------------------------------------------------------------- |
| Any substantive repository task         | `01-foundations.md`, `03-repository-discovery.md`                   |
| Versions, stability, recent features    | `02-releases.md`                                                      |
| Dependencies, manifests, imports, TS    | `04-packages.md`                                                    |
| Workspaces or monorepos                 | `05-workspaces.md`                                                  |
| Permissions, secrets, subprocesses      | `06-security.md`                                                    |
| Tests, CI, coverage, benchmarks         | `07-quality.md`                                                     |
| Node migration or npm compatibility     | `08-node-compatibility.md`                                          |
| Libraries, private packages, publishing | `09-libraries.md`                                                   |
| CLI, server, bundle, compile, desktop   | `10-artifacts.md`                                                   |
| Refactors, reviews, debugging           | `11-delivery-playbooks.md`                                          |
| Final verification                      | `12-verification.md`                                                |
| Ambiguous classification or edge case   | `15-decision-cases.md`                                              |
| Lifecycle when deliver-software is unavailable | `16-standalone.md`                                           |

Use `references/13-command-reference.md` to confirm command intent. Use current
official documentation when a command, option, API, stability status, or
platform guarantee could have changed.

### Reference-loading discipline

Before opening a reference, state the concrete decision it must resolve. Stop
loading references when the inspected repository evidence and current primary
sources answer that decision. Do not load release history, publishing,
artifacts, security, or workspace guidance merely because the repository uses
Deno.

When two references overlap, use the domain reference for the contract and the
verification reference only for proof. For example, use workspaces to decide
configuration ownership, then verification to prove the resulting workspace.

## Activation

Use this skill when at least one condition is true:

- the repository contains `deno.json`, `deno.jsonc`, or a Deno lockfile;
- the user mentions Deno, JSR, Fresh, Deno Deploy, `Deno.*`, `deno task`,
  `deno compile`, `deno bundle`, `deno desktop`, or Deno permissions;
- a package.json project is being run, tested, migrated, or managed with Deno;
- the work creates, changes, reviews, debugs, tests, benchmarks, publishes,
  compiles, or ships Deno software.

Do not introduce Deno into unrelated work merely because TypeScript is present.

## High-risk Deno contract surfaces

For any task touching one of these areas, do not answer from memory or generic
Node.js conventions. Read the relevant reference and verify current official
documentation:

- workspace member discovery, inheritance, and root-only options;
- ownership between `deno.json(c)` and `package.json`;
- `imports`, `scopes`, Deno `exports`, and npm conditional exports;
- `workspace:` and `catalog:` protocol placement;
- tsconfig discovery, precedence, and supported compiler options;
- Deno `publish: false` versus npm `private: true`;
- JSR versus npm dependency and publication decisions;
- named permission sets, allow/deny/ignore semantics, and artifact permissions;
- private npm registry authentication and CI reproducibility.

These surfaces are common sources of plausible but incorrect AI-generated
configuration. Include a source-of-truth and validation step in the proposed
change.

## Non-negotiable behavior

1. **Inspect before recommending.** Read the repository's manifests, tasks,
   exports, tests, CI, and connected subsystem contracts before choosing a
   design.
2. **Do not invent.** Never assume files, task names, exports, APIs, flags,
   configuration fields, package behavior, or deployment capabilities.
3. **Choose the package mode explicitly.** Classify the project as Deno-native,
   package.json-first, or hybrid before editing dependencies.
4. **Investigate the dependency ecosystem.** For a material dependency, inspect
   the owning workspace or organization, sibling packages, official adapters,
   registry metadata, exports, consumers, and version boundaries. Treat
   monorepo/ecosystem status as a hypothesis to verify, not a fact or a reason to
   install every sibling. Use `explore-ecosystems` as the evidence owner when it
   is available.
5. **Preserve working compatibility.** Existing package.json, npm packages, Node
   APIs, and foreign lockfiles are valid inputs. Do not rewrite them for
   ideological purity.
6. **Prefer complete changes.** Remove obsolete implementations, exports, tasks,
   docs, tests, dependencies, and compatibility shims made unnecessary by the
   completed change.
7. **Separate formatting-only changes.** Do not bundle unrelated formatter churn
   with behavioral, structural, dependency, naming, or refactoring work.
8. **Use evidence for claims.** Run the relevant commands. Never report a check
   as passing unless it actually passed.
9. **State stability and version requirements.** Experimental or unstable
   surfaces require explicit isolation, version pinning, and fallback planning.
10. **Use least privilege.** Permissions are part of the application contract,
   not incidental CLI flags.
11. **Keep runtime and data contracts aligned.** For external, persisted,
    configuration, or cross-process data, prefer Zod v4 schemas/codecs as the
    source of truth and infer TypeScript types.


## Output quality contract

A successful response or implementation makes clear:

- what the repository currently does;
- what must change and why;
- why the chosen Deno capability is appropriate now;
- what tradeoffs were rejected;
- how the implementation is structured;
- how correctness, compatibility, security, and operability were verified;
- what old code or configuration was removed.

A response that only recommends `deno fmt`, `deno lint`, and `deno test` is not
sufficient.
