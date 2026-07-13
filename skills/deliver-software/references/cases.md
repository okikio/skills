# Delivery decision cases

## Complete refactor

Inventory what must exist and what must disappear. Trace entrypoints,
implementations, consumers, exports, registration, configuration, tests,
fixtures, docs, examples, generated output, dependencies, flags, aliases, and
shims. Search obsolete names afterward. Passing tests do not prove cleanup.

## Behavior-preserving migration

Record inputs, outputs, errors, side effects, ordering, persistence,
concurrency, permissions, public types, and performance constraints. Keep
intentional behavior changes separate from structural work.

## Dirty worktree

Inspect status and relevant diffs. Preserve unrelated work. If user changes
overlap and safe integration is unclear, report the exact overlap rather than
erasing it.

## Diagnose only

Use read-only inspection and reproducible checks. Identify the earliest
divergence, evidence, and uncertainty. Explain a justified fix without applying
it.

## Validation and verification

Validation proves internal properties. Verification runs the actual CLI,
request, migration, artifact, browser interaction, deployment check, or
downstream consumer. If it cannot run, name the blocker and remaining steps.

## Connected systems

Expand inspection when a framework, deployment target, database, browser, or
consumer controls correctness. Read current primary docs and source when that
contract changes the design.

## Authorized modes

An explanation may use read-only inspection. A review reports findings without
repairing them. A diagnosis may reproduce a failure and narrow its cause but
does not implement the fix. A plan specifies changes without making them. A
change request carries implementation through cleanup and verification.
Publishing, pushing, deploying, messaging, and other external mutations require
their own authorization.

## Reference loading

Open a reference to answer a named decision. Browser UI work starts with web
semantics, then loads exactly one renderer reference determined from imports and
configuration. Composition guidance is necessary only for multi-region APIs,
shared descendant state, renderer comparisons, or explicit composition work.
Commit, pull-request, and changelog prose rules never govern one another.
