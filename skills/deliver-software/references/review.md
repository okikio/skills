# Code Review

Apply these rules only when:

- reviewing a diff
- generating review comments
- summarizing review findings
- evaluating correctness, risk, or maintainability of a change

Do not apply these rules to ordinary coding, docs writing, or commit/PR
authoring unless the task is explicitly a review.

## Review priorities

Prioritize correctness, clarity, maintainability, and standards alignment.

Review for whether the code tells one understandable story from top to bottom.
Smaller functions are not automatically clearer; extraction is useful when a
helper names a real concept, policy, lifecycle operation, reusable validation
rule, deterministic algorithm, or independently testable transformation.

Prefer fewer, higher-signal comments over noisy review spam.

## Review order

### 1. Correctness and contracts

Check:

- does the code do what it claims
- are edge cases handled
- are public contracts consistent across implementation and usage
- does important operation order remain explicit and correct
- do batching, retry, persistence, cache, audit, or lifecycle changes preserve
  their invariants

### 2. Failure modes and safety

Check:

- are errors explicit
- are trust boundaries clear
- are unsafe patterns introduced
- are inputs validated at boundaries
- does the change introduce hidden assumptions
- does the change affect `deno doc --lint` compliance

### 3. Types and narrowing

Check:

- avoid `any`
- use unions, generics, and narrowing where appropriate
- public signatures only reference exported public types
- return types are explicit and narrow at module boundaries

### 4. Readability and educational clarity

Check:

- names reveal intent
- non-obvious or complex logic is explained
- comments explain why, and when needed what or how
- comments connect local logic to the larger behavior instead of labeling vague
  boundaries
- cohesive logic is kept together unless extraction improves naming, reuse,
  policy isolation, or testability
- early returns are preferred when they let each branch show validation, work,
  and result together
- diagrams preserve enough detail to explain lifecycle, ownership, state, and
  failure-sensitive order
- diagrams are not overcompressed into tidy pipelines that hide the behavior
  being reviewed
- the diff is understandable without guessing the motivation

If the code is correct but its purpose is hard to infer, suggest improving:

- naming
- docstrings
- PR description
- examples
- diagrams

When suggesting diagrams, prefer chaptered walkthroughs for lifecycle-heavy
changes. Ask for a smaller diagram only when the current one repeats information
or obscures the main path; do not ask to simplify away branches, handoffs,
stored state, or cleanup that are needed to reason about correctness.

### 5. Consistency and style

Check:

- formatting matches the repo
- import structure matches the repo
- public docs follow the repo rules
- tests and benchmarks follow the repo rules where applicable

## Review output tags

Use:

- `[BLOCKER]`
- `[IMPORTANT]`
- `[SUGGESTION]`
- `[NIT]`

For every `[BLOCKER]` or `[IMPORTANT]`, provide a concrete fix suggestion.

Do not leave vague comments such as `improve quality` or `clean this up`.

Tie every comment to:

- a concrete risk
- a broken contract
- a correctness concern
- a readability problem
- or a standards mismatch
