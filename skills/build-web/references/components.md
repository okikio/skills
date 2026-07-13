# Components, styles, icons, and fonts

## Generated component contract

A copied component rarely stands alone. Inspect:

- `components.json` or registry provenance;
- renderer-specific source;
- Kobalte, Corvu, cmdk, or other behavioral primitives;
- CVA/variant definitions;
- generated `z-*` or equivalent stylesheet classes;
- shadcn/base stylesheet imports;
- Tailwind content scanning and tokens;
- application-level wrappers and accessibility tests.

If `button.tsx` refers to generated classes, copying only the TSX is incomplete.
Prefer composing installed primitives at the application layer before editing
generated internals.

## Primitive selection

Treat Solid Primitives as an ecosystem of granular packages, not a single hooks
library. For a candidate primitive inspect:

- package maturity stage;
- peer and sibling dependencies;
- `make*` non-reactive foundation versus `create*` reactive owner;
- server behavior and hydration contract;
- cleanup semantics;
- tests and documented edge cases.

Select packages by concern. Do not install unrelated primitives or recreate
event listeners, scheduling, media queries, observers, roots, or prop merging
without checking the relevant package.

## Styles and assets

Keep one token source, predictable layer order, focus-visible states, contrast,
forced-colors behavior, responsive overflow, and content-length resilience.

Astro templates and Solid/React islands may need different icon integrations.
Avoid wildcard inclusion of complete icon collections without measuring bundle
output. Define font loading, subsets, fallbacks, metric compatibility, and
render-blocking policy through the owning framework or Fontsource integration.
