
# Commit messages

Apply these rules only when writing or revising commit messages.

Do not apply them to changelog entries, release notes, PR prose, docs, code comments, or TSDoc unless the task is specifically about commit messages.

A good commit message should let someone scan `git log` and understand the work without opening every diff. Each message should make clear:

1. what changed
2. where it changed
3. what specific surface area was affected
4. what behavior, guarantee, workflow, edge case, or maintenance outcome is now true
5. why it mattered
6. whether there is migration or upgrade impact

Keep messages changelog-friendly, but preserve enough context that the commit history still tells the story of the work.

## Core shape

Use Conventional Commits:

`type(scope?): plain-english change to a specific surface area and the concrete outcome of the change`

The subject is the scan line. The body carries the nuance.

Write the subject around the most important changed surface and the concrete outcome, not the activity that produced it. A good subject answers the first pass of `what changed, where, and what is now true?` without forcing the reader to open the diff.

Good:
- `fix(parser): keep trailing text after unmatched table row delimiters`
- `feat(cli): print extraction counts in --json summaries`
- `docs(diagnostics): document UTF-16 ranges on "Unexpected token" recovery errors`
- `docs(api): add parser recovery range example for editor diagnostics`
- `test(storage): keep stale reads from extending per-origin cache expiry`

Bad:
- `fix: improve parser`
- `feat: add support`
- `docs: update docs`
- `docs(api): document offset stability`
- `test(storage): pin cache behavior`

## Subject rules

- Use a lowercase type.
- Use a scope only when it helps a reader locate the area quickly.
- Do not end the subject with a period.
- Name the result, not the effort.
- Prefer the behavior, guarantee, workflow, or contract that changed with specific concrete implementation detail.
- Name the changed surface area as specifically as the subject can reasonably carry.
- Include the concrete "and what": what is now true, fixed, protected, clarified, possible, or intentionally different.
- Include a concrete example when it makes the changed surface easier to scan, such as an exact title, route, command, field, output key, state, error message, or fixture case.
- If the commit includes several changes, lead with the highest-value surface and outcome, then leave supporting detail for the body.
- Avoid vague verbs such as `improve`, `update`, `enhance`, `clean up`, or `address` unless the object makes the outcome concrete.
- Avoid turning the subject into a shopping list.

Useful scopes include areas like `parser`, `events`, `cli`, `deps`, `scripts`, or `instructions`. Skip vague scopes such as `misc`, `general`, or `stuff`.

## Plain-English subjects

Prefer plain-English subject lines wherever possible.

A commit subject should be specific without becoming stiff or abstract. Name the changed surface area and the outcome in words a maintainer would naturally use while scanning `git log`.

Use technical terms when they are the clearest name for the surface, but do not make the subject sound more abstract than the change actually is.

Good:

```text
fix(parser): keep trailing text after unmatched table row delimiters
docs(diagnostics): document "Unexpected token" errors keep recovered UTF-16 ranges
refactor(popup): keep refresh buttons disabled during active analysis requests
bench(matcher): compare script-url indexing with full registry scans
```

Weak:

```text
refactor(popup): isolate refresh lifecycle state derivation boundary
docs(api): document offset contract semantics
fix(parser): remediate malformed table continuation behavior
```

## Subject specificity and surface area

Prefer plain-english subject lines that name the changed surface area and the concrete outcome. The subject should be natural to read, but specific enough that `git log` remains useful without opening every patch.

A good subject answers:

- what changed?
- where did it change?
- what specific surface, behavior, guarantee, workflow, or contract is affected?
- when or for whom does that matter?

Avoid broad guarantees that still force the reader to ask `for what?`, `where?`, or `who depends on this?`.

Weak:

```text
docs(api): explain UTF-16 offset guarantees
docs(api): document UTF-16 offset stability after parser recovery
test(storage): pin cache behavior
fix(parser): handle malformed tables
refactor(popup): improve refresh state
```

Better:

```text
docs(diagnostics): document "Unexpected token" errors keep recovered UTF-16 ranges
docs(api): add editor diagnostic example with recovered UTF-16 ranges
docs(parser): clarify recovered node spans used by source map output
test(storage): keep stale reads from extending per-origin cache expiry
fix(parser): preserve trailing paragraph after malformed table row delimiters
refactor(popup): keep refresh buttons disabled during active analysis requests
```

The body can carry nuance, tradeoffs, and secondary cases. The subject should still include enough of the affected surface and concrete result that the commit is useful as a scan line. When a subject says `stability`, `guarantee`, `behavior`, or `contract`, attach it to the exact consumer, output, field, route, command, state, or workflow that receives that guarantee.

## Concrete examples in subjects

Use a concrete example in the subject when it makes the changed surface easier to understand. Prefer naming the exact route, title, command, field, output key, state, error, or representative behavior over summarizing the change abstractly.

Weak:

```text
fix(page): correct document title
docs(api): document diagnostic range behavior
fix(parser): improve recovery message
test(storage): pin cache behavior
```

Better:

```text
fix(page): change settings title to "Lorem Ipsum"
docs(diagnostics): document "Unexpected token" errors keep recovered UTF-16 ranges
fix(parser): attach "unterminated table row" errors to the recovered node
test(storage): keep stale analysis reads from extending per-origin cache expiry
```

Concrete examples are especially useful for visible copy, error messages, command names, routes, field names, event names, output keys, state names, fallback behavior, test fixtures, and API guarantees. Do not overload the subject with every changed value. Name the example that best represents the changed surface, then put secondary examples in the body.

A concrete example should still say what the example proves. `document "Unexpected token" recovery errors` is better than `document diagnostic behavior`, but `document "Unexpected token" errors keep recovered UTF-16 ranges` is stronger because it names the diagnostic, the affected range surface, and the documented guarantee.

## Documentation subject verbs

Prefer verbs that describe the documentation change directly.

- Use `add` when the commit adds a concrete example, guide, section, table, command, or note.
- Use `document` when the commit records a guarantee, behavior, limitation, migration step, or contract.
- Use `clarify` only when the subject names the ambiguity being resolved.
- Use `describe` when the commit explains how a workflow or mechanism operates.
- Avoid `show` unless the commit literally changes a displayed UI, screenshot, demo, or rendered example.

Good:

```text
docs(api): add editor diagnostic example with recovered UTF-16 ranges
docs(diagnostics): document "Unexpected token" errors keep recovered UTF-16 ranges
docs(parser): clarify recovered node spans used by source map output
docs(cli): describe --json count fields in batch extraction summaries
```

Weak:

```text
docs(api): show parser recovery keeps UTF-16 ranges
docs(parser): clarify parser behavior
docs(cli): explain --json output
docs(api): document guarantees
```

## Documentation subjects as mini-summaries

A `docs` subject should act as a mini-summary of the documentation that was written. It should not only say that documentation exists. It should compress the actual documentation claim, example, workflow, limitation, or guarantee into the scan line.

A good `docs` subject answers:

- what did the new or revised documentation teach?
- which reader, command, output, API, error, route, or workflow is affected?
- what concrete example, guarantee, limitation, or migration step is now captured?

Weak:

```text
docs(api): add parser recovery docs
docs(cli): update --json section
docs(parser): clarify source maps
docs(auth): document redirect behavior
```

Better:

```text
docs(api): add editor diagnostic example with recovered UTF-16 ranges
docs(cli): describe --json count fields in batch extraction summaries
docs(parser): clarify recovered node spans used by source map output
docs(auth): document login redirects preserving return_to on expired sessions
```

The subject should read like a short summary of the added paragraph, table, example, or section. If `add`, `document`, `clarify`, or `describe` is followed by a broad noun, keep going until the changed documentation surface and its concrete point are visible.

## Body

Add a body when the subject alone would hide important context. Typical cases:

- the change is not obvious from the subject
- the commit fixes or covers more than one important case
- the behavior is subtle or easy to misread
- the change affects migration, compatibility, rollout, or upgrade work
- the commit includes performance or measurement claims that need support

A good body usually explains:

- what was wrong or limited before
- what is true now
- why the change matters
- the most important secondary cases or tradeoffs
- any migration or rollout note a future reader will need

Prefer short bullets or short paragraphs. Avoid filler such as `add tests`, `cleanup`, or `misc fixes` unless tied to the behavior they protect or enable.

## Body narrative pattern

When the change needs context, use a smooth before-and-after narrative.

A useful shape is:

```text
Previous behavior:
New behavior:
Why it matters:
```

Use the labels when they improve scanning. Otherwise, write the same story as one or two concise paragraphs.

## Scope governance

Use scopes as project navigation, not decoration.

A scope should name a real subsystem, package, workflow, interface, or toolchain area. Avoid scopes that merely name a file location, vague layer, activity, or bucket for unrelated work.

For mature projects, keep a small scope map that documents:

- scope name
- what subsystem or workflow it represents
- when to use it
- when not to use it
- rejected or merged alternatives

Reject vague scopes such as `misc`, `cleanup`, `core`, `utils`, `shared`, `common`, and `app` unless the project has given one of those names a precise meaning.

## Commit plans for multi-step work

For migrations, refactors, and patch series, plan each commit before writing it.

A useful commit plan records:

- commit message
- why this step exists
- changes included
- files likely touched
- verification steps
- acceptance criteria
- risk
- rollback path

Keep this planning detail in the PR, design note, or patch plan. Do not force all of it into the final commit body.

## Reviewability and rollback

A good commit should be reviewable and revertible as one coherent unit.

Before finalizing, check:

- does the commit change one subsystem, workflow, or contract?
- are unrelated cleanups excluded?
- can the reviewer understand the intent without reconstructing the whole diff?
- can the commit be reverted without undoing unrelated work?

## Type guidance

Choose the type that best matches the outcome:

- `feat`: a new capability now exists
- `fix`: broken behavior now works correctly
- `docs`: a specific fact, contract, rule, limitation, example, workflow, or migration step is now clear
- `refactor`: internal structure changed with no intended behavior change
- `perf`: something got faster, smaller, or cheaper in a way worth naming
- `test`: a behavior or regression case is now protected
- `bench`: benchmark coverage or measurement trust improved
- `chore`: maintenance outcome changed, but not a user-visible behavior
- `build`: build, packaging, or dependency behavior changed
- `ci`: pipeline or automation behavior changed

Type-specific precision matters. For example:

- `feat` should name the new capability, not just "support"
- `fix` should name the broken behavior that now works
- `docs` should summarize the fact, example, workflow, limitation, or guarantee now documented, not the writing effort
- `refactor` and `chore` should not be used to hide meaningful behavior changes
- `perf` should say what got cheaper and where it matters; include the practical effect in the body when useful

## Breaking changes

Mark breaking changes with `!` and explain the migration impact in the body or footer.

Example:

```text
feat(api)!: remove implicit trim from align()

BREAKING CHANGE: Callers that relied on implicit trimming must call trimEnd() explicitly before align().
```

Make the impact easy to spot. State what changed, who is affected, and what they now need to do.

## Final check

Before finalizing a commit message, check:

- can someone tell what changed from the subject alone?
- does the subject name the affected surface area precisely enough for `git log` scanning?
- does the subject include the concrete behavior, guarantee, workflow, or example that makes the change understandable?
- for `docs` commits, does the subject read like a mini-summary of the documentation rather than a note that docs changed?
- does the subject avoid vague nouns such as `stability`, `behavior`, `contract`, or `guarantee` unless the exact affected surface is named?
- if they read the body, can they understand the important context without opening the diff?
- does the commit preserve the details a future changelog writer would want?
- if several commits are viewed together in `git log`, do their subjects read like a coherent story instead of a list of activities?
- if the change is breaking, is the migration step explicit?
