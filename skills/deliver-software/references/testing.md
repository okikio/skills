
# Testing Rules

## Tools

Default to:
- `jsr:@std/testing/bdd` for `describe` and `it`
- `jsr:@std/expect` for assertions
- `npm:fast-check` for property-based tests

Imports should usually follow this shape:

```ts
import { describe, it } from 'jsr:@std/testing/bdd';
import { expect } from 'jsr:@std/expect';
import * as fc from 'npm:fast-check';
```

If a local project already uses a Jest-style `expect` surface through another compatible test runner such as Vitest, keep the same assertion style rather than fighting the local tool.
Prefer consistency of test ergonomics when the underlying assertion model is effectively the same.

The rules around test quality and structure still apply regardless of the test runner or assertion library. There are also integrations for `fast-check` with test runners, e.g. `@fast-check/vitest` try taking advantage of those when using `fast-check` with a compatible test runner.

## Core principle

Test behavior, not implementation.
Treat each module as a black box.
Call the public API and assert on observable results.
Do not assert on private state, internal helpers, or incidental implementation details when public behavior is available.

## Determinism and independence

- No shared mutable state between tests.
- No ordering dependencies.
- No wall-clock or environment dependence unless explicitly isolated.
- One logical behavior per test.

If a test description needs the word `and`, it is probably two tests.

## Clarity over DRYness

Tests are documentation.
Prefer straightforward setup over clever helper layers that hide intent.
Use the AAA pattern:
- Arrange
- Act
- Assert

Human-written expected values are better than generated expected values that repeat the implementation logic.

Tests for lifecycle-heavy behavior should tell the same story a maintainer needs
to debug the feature. Keep setup visible when it explains the behavior. Extract a
helper only when it names a real fixture concept, repeated scenario, policy,
lifecycle operation, or independently reusable assertion.

For non-trivial setup, add a short comment that explains:
- what behavior is protected
- why the setup has this shape
- what regression the test would catch
- how the behavior connects to the larger lifecycle or algorithm

## Property-based tests

Use `fast-check` for invariants.
High-value properties often include:
- never-throw behavior where relevant
- round-trip stability
- schema validation and parsing stability
- schema edge cases such as empty input, missing fields, extra fields, and malformed input
- input poisoning and fuzzing patterns relevant to the domain
- content preservation where applicable
- idempotence where applicable
- structural well-formedness
- oracle comparison where a trustworthy baseline exists

## Edge cases

Always look for edge cases that match the local domain.
Common examples include:
- empty input
- single-item input
- boundary counts such as 0, 1, and 2
- mixed line endings when text processing matters
- malformed or partial input
- Unicode edge cases when text handling matters
- extremely long inputs or repeated structures

## Anti-patterns

- Do not assert giant multi-line strings when a structural assertion is more robust.
- Do not run a code path without asserting anything meaningful.
- Do not over-abstract test helpers.
- Do not rely on timing assertions in normal unit tests.
- Do not test internals when public behavior is available.
