# `@okikio/wikitext`

The reviewed repository is experimental: manifest version `0.0.0`. Classify it
accordingly and inspect exports at the target revision.

## Cost ladder

1. `tokens()` for lexical inspection.
2. `outlineEvents()` for block-only structure.
3. `events()` for full streaming syntax.
4. `parse()` for a materialized unist-shaped tree.
5. Analyze once, then materialize with strict, tolerant, or recovery policy.
6. `createSession()`/`BasicSession` for repeated lanes over the same source.

Use the cheapest representation that satisfies the operation. Do not allocate a
full AST when a streaming event filter or outline is enough.

## Architecture

Source spans remain authoritative. Tokenization, block parsing, inline parsing,
events, tree building, diagnostics/recovery, filtering, sessions, and
materialization are distinct layers. One findings pipeline can support multiple
materialization policies without reparsing everything.

Sessions cache lanes separately. Preserve deterministic ranges, token tiling,
properly nested events, optional diagnostics on hot paths, and arbitrary-input
no-throw behavior.

## Missing exports

The reviewed manifest publish include and README mention `stringify`, but no
`stringify.ts` or public export exists. The README also says `stringify()` and
`parseChunked()` are not implemented. Do not write imports for either until the
actual target export map and tests prove availability.

This discrepancy is a deliberate anti-hallucination check: documentation intent
does not supersede current source.

## Verification

Test malformed and Unicode-heavy arbitrary input, complete source-range tiling,
event nesting, deterministic repeated sessions, strict/tolerant/recovery
differences, and memory/time at the selected lane. Keep experimental limitations
in public recommendations.
