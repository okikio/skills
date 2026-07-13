# Configuration resolution

## Three different shapes

Keep these contracts distinct:

1. Authored config accepts ergonomic syntax, operations, shorthands, and partial
   values.
2. Resolved patch is sparse, normalized, validated, and contains no defaults for
   values the source did not author.
3. Runtime config is complete, defaulted, executable, and free of authoring
   operations.

Do not expose authoring operations to domain code.

## Precedence and evaluation

State precedence from highest to lowest, for example CLI, environment, project,
user, defaults. When array operations must compose, evaluate layers from lowest
to highest while applying the higher layer last. Do not confuse the public
precedence order with the implementation traversal order.

Define semantics for:

- `undefined`, `null`, `false`, `0`, and empty strings;
- ordinary recursive objects;
- arrays, normally replacement rather than accidental concatenation;
- discriminated unions, normally atomic replacement;
- supported append/prepend/replace operations;
- deletion or reset where the product permits it;
- final defaults and validation.

## c12 and defu ownership

c12 owns discovery, loaders, extension layers, environment selection, and
dynamic config factories. defu can implement pairwise default merging, but the
application must define array, union, and operation behavior explicitly.

Check the installed c12 version. Major or prerelease boundaries can change
loaded-layer metadata and APIs. Verify actual `extends`, environment layers,
async factories, and TypeScript config loading through the public resolver.

Evaluate dynamic factories once per invocation unless the product explicitly
defines another lifecycle. A two-pass parser must not silently execute config
side effects twice or promote first-pass defaults into a second-pass CLI patch.

## Source provenance

`config explain` should report per-field winner, source, shadowed values, and
operation contributions. A static precedence list is not an explanation.
`config files` should use all resolved layer metadata, not only the final path.

Give `.env`, process environment, parser environment terms, user config, and
project config one coherent source algebra. Do not map one setting through
multiple independent loaders without explicit reconciliation.

## Required tests

- falsy values and missing values;
- object recursion and array replacement;
- empty-array reset;
- append/prepend/replace across at least three layers;
- atomic union replacement without stale branch fields;
- immutable inputs and cleaned runtime output;
- real c12 extension chains and factories;
- factory single evaluation;
- provenance and shadowing;
- malformed lower and higher layers;
- final public runtime schema.
