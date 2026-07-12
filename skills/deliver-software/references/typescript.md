
# TypeScript / Deno Rules

## Runtime and module model

Assume Deno v2, strict TypeScript, and ESM unless the local project clearly says otherwise.
When using npm packages via `npm:` specifiers, prefer explicit type imports and document any known type gaps. Avoid mixing `npm:` and `jsr:` specifiers for the same logical dependency.
Keep modules tree-shakeable. Avoid top-level side effects unless they are clearly required.
Avoid hidden global state. Avoid surprising initialization during import.

## Readable flow before abstraction

Code should tell one understandable story from top to bottom.

Prefer cohesive flows where the reader can follow the lifecycle without jumping
across many tiny helpers. Extract a helper only when it represents a named
concept, is reused, or is significantly easier to test in isolation. Do not
extract helpers merely to shorten inline code or add architectural layers.

Prefer early returns when each branch can complete the work directly. Avoid
storing branch results in a mutable variable just to return later.

## Formatting and imports

Use tab characters for indentation. Configure tab width as 2 in `deno.json` or `.editorconfig` (`"indentWidth": 2`).
Keep opening braces on the same line as declarations.
Use explicit file extensions.
Separate type imports from value imports with `import type`.
Group imports by role in this order:
1. types
2. runtime or external dependencies
3. shared internal modules
4. local modules

## API and type design

Avoid `any`. Prefer explicit, narrow return types at module boundaries.
Prefer unions, generics, discriminated unions, and narrowing.
Keep public keys stable unless an explicit migration is intended.
Any type referenced in a public signature must itself be exported.

Types should make the system flow easier to read.

Prefer discriminated unions when values move through distinct states, such as
request acceptance, resource loading, audit availability, lifecycle status, job
progress, or cache freshness.

Prefer named types when the name captures a real domain concept, such as
`LookupIndex`, `AuditTrace`, `WorkflowSession`, `JobRequest`, `WorkerResult`, or
`PipelineEvent`.

Avoid generic names that hide domain meaning, such as `Data`, `Entry`,
`Payload`, `Manager`, or `Handler`, unless the surrounding module gives them
precise meaning.

Prefer JavaScript-native TypeScript. Avoid TS-only ceremony when JavaScript can already express the idea clearly.
Avoid `public` by default in classes. Prefer `#private` when appropriate.
Use `protected` only when inheritance genuinely requires it.
Prefer constant objects plus derived types over TypeScript `enum` by default.

## Naming conventions

Use `camelCase` for functions, methods, variables, parameters, getters, setters, and class properties.
Use `snake_case` for plain record fields, normalized payloads, schema-like data, and persistence-oriented keys.
Use `PascalCase` for classes, interfaces, type aliases, and other major abstractions.
Use `UPPER_SNAKE_CASE` for true constants.

Mirror external naming at the boundary, then normalize internally once the data enters the project’s own domain model.

## Object and lookup patterns

Prefer object spread for simple clone or merge operations. Use `Object.assign(...)` when mutating an existing target or when that shape is clearer.
For simple membership checks, prefer object lookup tables over `Set` when key existence is all that is needed.
Use `Object.create(null)` when a prototype is unnecessary. Freeze static lookup tables when immutability helps communicate intent.
For simple dense numeric or byte-range checks, prefer `Uint8Array`.

## Public API documentation bar

For every exported function, interface, type alias, and constant:
- write TSDoc in plain English
- explain why it exists, not just what it is
- ground the explanation in the problem being solved, the approach taken, and the assumptions or edge cases
- define technical terms in concrete language the first time they matter
- tie abstractions to a real behavior, cost, failure mode, or downstream benefit
- document each field of an exported interface or public type individually

For non-trivial public APIs:
- include at least two examples
- include one common path
- include one edge case or configuration variant
- give each `@example` block a descriptive name

## Complex logic and performance-sensitive code

When logic is not easy to infer from a quick read, explain it clearly in comments or TSDoc.
This especially applies to:
- regex-heavy code
- binary or bitwise logic
- tricky branching
- parser recovery or normalization logic
- boundary conversion logic
- performance-sensitive code
- concurrency or lifecycle coordination

When useful, include:
- a short explanation of intent
- key assumptions or invariants
- a step-by-step walkthrough
- clarification of abstract markers or codes
- an ASCII diagram when it materially improves understanding

For lifecycle-heavy TypeScript, diagrams should preserve the important sequence,
ownership, state transitions, and failure paths. Do not overcompress the diagram
if the missing detail explains why the types, states, or branches exist.

For non-obvious performance optimizations, explain what changed, how it works, what cost it reduces, why that matters for this workload, and why the gain is worth the readability cost.

## Error handling and validation

Do not let internal complexity leak into vague error handling.
Prefer typed errors or discriminated union results where appropriate.
At system boundaries, validate inputs explicitly.
Preserve recovery behavior where that is part of the contract.

After public API or documentation changes, run `deno check`, `deno lint`, and
`deno doc --lint` if the project exposes them, and fix any reported issues.
