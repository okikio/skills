---
name: deliver-software
description: Plan, implement, refactor, review, validate, and verify software work to completion under cross-project engineering standards. Use for codebase changes, architecture or migration plans, completion audits, code reviews, Deno and strict TypeScript, Python, schema-backed contracts, tests, benchmarks, TSDoc and comments, technical documentation, ASCII diagrams, commits, pull requests, changelogs, and browser interfaces in HTML, CSS, React, Solid, or Astro. Especially use when a refactor must remove legacy paths, a multi-part plan must not stop at a partial slice, or a runnable deliverable needs executable proof.
---

# Deliver Software

## Composition contract

Own the general delivery lifecycle when a domain skill is also active. Let the
domain skill own changing APIs, configuration grammar, compatibility contracts,
and domain-specific verification. Discover once, produce one integrated plan,
and report one completion verdict. For ambiguous migrations and refactors, read
[delivery cases](references/cases.md).

Apply a compact routing layer over the bundled engineering instructions. Load the
base rules first, add only the references relevant to the task, and carry
delivery work through implementation, cleanup, validation, and real
verification.

## Resolve the controlling instructions

1. Read [base.md](references/base.md) for every task.
2. Inspect repository-local instructions, configuration, existing code, and
   documented project conventions before choosing an implementation shape.
3. Treat explicit user requirements and project-specific constraints as more
   specific than the bundled defaults. Surface a material conflict before
   editing instead of silently choosing one side.
4. Read every task and surface reference selected by the routing table. Do not
   load unrelated framework or writing references.
5. Apply universal references before their specialized layer. For example,
   apply `web.md` before `solid.md`, and `docs.md` before `diagrams.md` when an
   ASCII diagram appears in long-form documentation.

Do not infer React or Solid from a `.tsx` extension alone. Determine the renderer
from imports, configuration, and surrounding code, then load only that
framework's reference.

## Route the task

| Work | Read |
| --- | --- |
| Code, architecture, API design, refactor, or migration | [general.md](references/general.md) |
| Substantial plan, implementation, refactor, migration, completion audit, or multi-surface change | [workflow.md](references/workflow.md) and [delivery.md](references/delivery.md) |
| Refactor, migration, cutover, compatibility window, or legacy removal | [refactors.md](references/refactors.md) |
| Deno, TypeScript, or TSX | [typescript.md](references/typescript.md) |
| Python | [python.md](references/python.md) |
| Tests or test design | [testing.md](references/testing.md) |
| Benchmarks or performance claims | [benchmarks.md](references/benchmarks.md) |
| TSDoc or source comments | [comments.md](references/comments.md) |
| Code review or diff findings | [review.md](references/review.md) |
| Markdown, design notes, architecture docs, guides, or long-form technical prose | [docs.md](references/docs.md) |
| Commit messages or commit plans | [commits.md](references/commits.md) |
| Pull request titles, descriptions, or merge summaries | [pulls.md](references/pulls.md) |
| Changelogs or release notes | [changes.md](references/changes.md) |
| Package or product release execution | [releases.md](references/releases.md) |
| ASCII diagrams in docs, comments, or explanations | [diagrams.md](references/diagrams.md) |
| Any browser-facing interface | [web.md](references/web.md) |
| React, Next.js, Remix, or React Router UI | [react.md](references/react.md) |
| Solid or SolidStart UI | [solid.md](references/solid.md) |
| Astro pages, components, content, scripts, or islands | [astro.md](references/astro.md) |
| Multi-region component APIs, renderer comparisons, compound components, slots, or cross-framework composition | [composition.md](references/composition.md) |

For compound tasks, combine the relevant rows. A Solid component with tests and
TSDoc requires `general.md`, `typescript.md`, `testing.md`, `comments.md`,
`web.md`, and `solid.md`. Add `composition.md` only if the component exposes
multiple semantic regions, shares state across descendants, or is being compared
across renderers.

Keep task-specific writing rules isolated. Do not apply commit prose rules to a
changelog, PR rules to TSDoc, or general documentation rules where a narrower
reference explicitly governs the artifact.

## Adapt the source environment

The bundled delivery documents originated in a GitHub Copilot instruction set.
Preserve their intent while mapping environment-specific terms to available
capabilities:

- Treat `.github/instructions`, `AGENTS.md`, and similar paths as examples of
  repository-local instruction sources. Inspect the locations the current
  repository actually uses.
- Treat `.agents/research/` as the preferred reusable research cache only when
  the repository contains or intentionally uses it. Do not create project
  bookkeeping files unless the task or repository workflow calls for them.
- Treat Context7 and named documentation tools as requests for current,
  maintained documentation. Use available official or primary documentation
  tools and never invent an unavailable tool result.
- Treat workspace read, search, edit, execute, and task tracking names by their
  capabilities, using the tools available in the current environment.
- Treat the named delivery agents as role briefs. If collaboration is available,
  permitted, and useful, delegate independent work with the matching brief. If
  it is unavailable or would add overhead, perform the roles sequentially while
  preserving their separation.

## Carry work to completion

### 0. Classify the authorized mode

Classify the request before choosing a workflow:

| Mode | Authorized behavior |
| --- | --- |
| Answer or explain | Inspect only as needed; do not edit or publish |
| Review or audit | Inspect and report evidence; do not fix findings |
| Diagnose | Reproduce and identify the cause; do not implement a fix |
| Plan or design | Inspect, research, compare, and specify; do not implement |
| Change or build | Implement, clean up, validate, and verify |
| Publish or release | Mutate external state only when explicitly requested |

A request to inspect, explain, review, diagnose, or plan does not silently
authorize implementation. A change request authorizes ordinary in-scope edits
and verification, but not unrelated cleanup or external publication.

### 1. Lock the deliverable

Extract the real outcome, constraints, non-goals, and success conditions. Ask a
small number of questions only when an answer would materially change scope,
acceptance criteria, cleanup, or verification. Otherwise, state necessary
assumptions and continue.

For substantial work, define acceptance criteria that cover both what must exist
and what must no longer remain. Enumerate every in-scope deliverable so the work
cannot silently stop after the first visible slice.

### 2. Inspect before inventing

Search in this order when the repository provides each layer:

1. reusable local research
2. applicable repository instructions
3. existing code, tests, scripts, docs, and configuration
4. maintained packages and current primary documentation
5. broader external research for unresolved gaps

Identify the controlling code path, adjacent contracts, existing abstractions,
deprecated APIs, and likely cleanup surfaces before editing. Prefer reuse when
it genuinely fits the required contract.

State the decision each reference must resolve before loading it. Stop when
repository evidence and current primary sources resolve that decision. Loading
every potentially relevant reference is a routing failure, not extra diligence.

### 3. Plan the full surface

Track implementation, cleanup, validation, executable verification, and final
plan review as separate work. Include dependencies and ordering, plus parallel
workstreams when they are truly independent.

For refactors and migrations, explicitly search for:

- old and new paths remaining active together
- temporary wrappers, aliases, adapters, flags, and shims
- stale imports, exports, dependencies, tests, docs, comments, and examples
- old names or ownership that preserve the obsolete mental model
- behavior changes accidentally mixed into a structure-only refactor

Do not redefine a complete migration as a first pass unless the user changes the
scope.

### 4. Implement the locked outcome

Follow the loaded language and surface rules. Keep behavior stable unless an
intentional behavior change is part of the locked deliverable. Treat runtime
schemas as contract sources and infer static types from them when the schema
defines the data shape.

After the first substantive edit, run the narrowest useful check before widening
the change. Continue until the full deliverable and required cleanup are present.

### 5. Validate the changed surface

Prove internal soundness with the narrowest checks that cover the changed code or
document. Depending on the repository, this can include type checking, linting,
targeted tests, documentation lint, schema checks, deprecation checks, and
instruction compliance.

Do not equate validation with end-to-end success. A typecheck or unit test can
prove a contract locally without proving the user's workflow works.

### 6. Verify the real capability

Run the actual CLI, server workflow, migration, generator, job, UI interaction,
or other user-facing capability whenever the environment permits it. Record the
exact workflow and observed behavior. Use tests and static checks as supporting
evidence, not substitutes for an executable workflow that can be run.

Before verification mutates state, identify the exact target, data and
credential owner, external messages or charges, reversibility, rollback,
cleanup, and whether the request authorizes that consequence. A request to
change migration, deployment, release, notification, or billing code does not
implicitly authorize running it against ambient production credentials.

If the capability cannot be run, name the concrete blocker and the remaining
verification steps. Never label an unrun capability verified.

### 7. Reconcile plan and outcome

Compare four layers before finishing:

1. requested outcome
2. planned outcome
3. implemented outcome
4. verified outcome

Also check plan completion separately from deliverable completion. Claim
completion only when the full plan was covered and the concrete deliverable was
proven, or clearly report the remaining gap or blocker.

## Use role separation deliberately

Read a role brief before delegating or performing a distinct pass:

- [planner.md](references/planner.md): lock scope, acceptance criteria, plan
  coverage, dependencies, parallelism, and verification before edits.
- [implementer.md](references/implementer.md): make the complete code or docs
  change and run focused local checks.
- [validator.md](references/validator.md): inspect the changed surface without
  fixing it, and prove technical and instruction compliance.
- [verifier.md](references/verifier.md): run the real capability without editing
  it, and report observed evidence.

Keep the final completion judgment with the primary agent. Review delegated
evidence instead of accepting a bare pass or fail. Do not give a validation or
verification agent the intended answer, suspected bug, or expected verdict.

## Report evidence proportionally

Lead with the outcome. For ordinary implementation work, summarize the completed
deliverable, important changes, checks actually run, and any remaining blocker
or unproven behavior.

For delivery audits, refactors, migrations, and multi-surface work, use the full
structure in `delivery.md`: deliverable, acceptance criteria, plan coverage,
task state, findings, verification, plan review, and one final verdict. Do not
claim checks that were not run. Keep small tasks concise while preserving the
same completion standard internally.
