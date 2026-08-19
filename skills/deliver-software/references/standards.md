# Current software engineering standards

## Purpose

This reference collects the cross-project conventions that now recur across
Kaiju Platform, Kaiju Crawl, OPFS, MediaD, RDF/SPARQL, extension, and utility
work. It exists so a task does not need to restate the same naming,
documentation, schema, lifecycle, formatting, and verification rules.

A project-specific requirement, current repository behavior, or explicit user
instruction can narrow these rules. Do not use this file to overwrite a more
specific source of truth.

## Source authority

Use this order when sources disagree:

1. The user's latest explicit requirement.
2. The latest supplied or checked-out source tree and its executable tests.
3. Repository-local instructions and focused project handoffs.
4. This cross-project standards reference and the focused skill for the task.
5. Current primary upstream documentation and source.
6. Older handoffs, examples, remembered APIs, and historical notes.

A document that describes a target design is not proof that the repository
implements it. Keep `verified current`, `target`, `benchmark-gated`, and
`unverified` claims distinct when the difference matters.

## Naming

Prefer the shortest concrete name that remains exact at its definition and every
call site.

- Prefer one concrete word when the package, module, type, or namespace supplies
  the rest of the meaning.
- Use two words when one word is ambiguous.
- Use three words only when a real distinction still requires them.
- Treat more than three words as a design warning. Constants are exempt.
- Do not abbreviate unless the abbreviation is established and unambiguous.
- Avoid generic architecture nouns when a concrete concept is available. Name the actual API, process edge, trust zone, transaction scope, module interface, network hop, or ownership point.
- Avoid vague project-owned names such as `generate`, `execute`, `handle`,
  `process`, `manager`, `helper`, `common`, `shared`, `misc`, `data`, `item`,
  `thing`, and `worker` when a more exact concept exists.
- `worker` is valid only for the actual runtime concept, such as a Web Worker,
  Deno Worker, or queue worker. Otherwise name the real process, thread, page,
  task, claim, lease, or operation.

Prefer concrete verbs such as `get`, `create`, `open`, `save`, `inspect`,
`plan`, `convert`, `download`, `select`, `write`, `close`, `pause`, `resume`,
and `cancel`.

Use `get` for addressable retrieval. Reserve `read` for consuming files,
streams, readers, cursors, archive entries, or other sequential sources.

`ctx` is acceptable for one well-typed execution context when the surrounding
operation makes its role clear. Do not create a universal context bag that
contains unrelated services, state, configuration, logging, storage, and
runtime resources merely to shorten parameter lists. Name distinct contexts
when they carry different lifetimes or responsibilities.

### Namespaces and imports

Use namespace imports for coherent operation families when the namespace makes a
short operation precise:

```ts
import * as capacity from '@utils/capacity';
import * as permissions from '@utils/permission';

const lease = await capacity.acquire(request);
const args = permissions.args(definition);
```

Prefer direct imports for schemas, schema-derived data types, individually
meaningful constants, and types that should remain self-identifying:

```ts
import { SourceSchema, type SourceType } from '@media/source';
```

Do not use a namespace to hide an oversized or incoherent public surface.
Re-export a namespace only when the complete runtime module object is an
intentional public API.

## Schemas, types, interfaces, and fields

Use runtime schemas as the source of truth for project-owned serializable,
persisted, configuration, transport, and cross-process data when the project
has selected Zod or another executable schema system.

### Zod naming

- Every Zod schema constant ends in `Schema`.
- Project-owned schema-derived data types normally end in `Type`.
- Infer schema-owned types from the schema. Do not duplicate the same data shape
  in a hand-written interface.
- Use `z.output<typeof NameSchema>` when callers consume the parsed output shape.
  Use the input type only when the pre-parse shape is itself part of the API.

```ts
export const SourceSchema = z.discriminatedUnion('kind', [
  UrlSourceSchema,
  BlobSourceSchema,
  StreamSourceSchema,
]);

export type SourceType = z.output<typeof SourceSchema>;
```

### Behavior contracts

Interfaces and classes that model behavior, live resources, or provider
capabilities use the concrete domain noun without a `Type` suffix:

```ts
export interface Writer extends AsyncDisposable {
  write(chunk: Uint8Array): Promise<void>;
}
```

Do not put executable functions, live handles, loggers, fetch functions, or
other runtime resources inside stable data schemas solely to avoid defining a
behavior contract.

### Field documentation

Document public fields individually when their meaning is not completely
obvious from the field name and primitive type. Include the information that can
change caller behavior, such as:

- units and scale;
- defaults and when defaults apply;
- `null`, missing, unknown, and invalid semantics;
- ownership or whether a resource is borrowed;
- source, authority, or provenance;
- lifecycle state and terminal conditions;
- limits, boundedness, and memory implications;
- version or compatibility meaning.

Apply the same rule to important internal state. A private field that controls a
state machine, cache invalidation, sequence number, lease, parser cursor,
retirement generation, or cleanup invariant can need more documentation than a
thin public wrapper.

## Comments and TSDoc

Document every exported symbol that represents a real contract and every
important non-exported symbol whose purpose, invariant, lifecycle, data meaning,
or failure behavior is not obvious from its name and local code.

This includes important private/internal:

- functions and methods;
- classes and behavior interfaces;
- schema constants and schema-owned data types;
- fields and state records;
- parser tables and token maps;
- regular expressions;
- constants with domain meaning;
- resource factories and disposal paths;
- concurrency, cache, queue, retry, checkpoint, and state-machine helpers;
- benchmark fixture builders when they define the workload being measured.

Skip comments only when the complete behavior is already obvious from the name,
types, and a quick read of the implementation.

A useful comment or TSDoc block builds the reader's mental model in this order
when the information applies:

1. What the concept means.
2. Why it exists or what problem it solves.
3. What owns it and what it owns.
4. The important lifecycle or transformation.
5. The invariant that must stay true.
6. Cancellation, disposal, retry, or recovery behavior.
7. Limits, performance, memory, or boundedness.
8. Expected failures and what is deliberately not guaranteed.
9. A concrete example when behavior is not obvious.

Do not make comments self-referential or dependent on hidden project history.
Avoid phrases such as "this module exists to", "the code above", "as discussed
in the README", or "our new approach" when the same meaning can be stated as a
portable domain fact.

Comments must match current behavior. Do not document a proposed future state as
if it already runs.

## Documentation

Use plain English by default. Apply ASD-STE100 or the project's controlled
Simplified Technical English mode only when the user explicitly requests it or a
formal document requires it.

Long-form technical documentation should orient the reader before mechanics:

```text
problem and user/caller need
  -> mental model
  -> ownership and major concepts
  -> normal lifecycle
  -> concrete usage
  -> failures and non-happy paths
  -> limits and performance
  -> verification and operational consequences
```

Use progressive disclosure. Explain a term when it first becomes necessary.
Prefer transitions over many small headings. Use examples, tables, lists, and
ASCII diagrams when they make the behavior easier to understand rather than
merely decorating the document.

A package README should normally answer:

- What capability does the package own?
- What does it deliberately not own?
- What is the smallest useful call site?
- What data contracts does it accept and return?
- Which resources are owned or borrowed?
- How do cancellation, cleanup, retries, and recovery work?
- Which limits and runtime constraints matter?
- Which failures should callers expect?
- Which runtimes are supported and how was that verified?
- Which tests, benchmarks, or conformance suites prove important claims?

Keep reference material, conceptual explanation, tutorials, and troubleshooting
focused by question. Do not build one master document or diagram that mixes every
concern.

## Formatting

Formatting communicates structure. It is not a line-count competition.

- Keep function calls compact when their arguments remain easy to scan.
- Keep extra-short object literals, arrays, tuples, and signatures flat.
- Expand declarations and configuration objects more freely when vertical
  structure makes comparison, ownership, comments, or public contracts clearer.
- Expand calls when nested conceptual groups, comments, or long expressions need
  structure.
- Do not force every argument or property onto its own line.
- Do not force a dense one-line form merely to reduce vertical space.

Keep functional and formatting-only changes separate. Format only directly
changed code unless the task explicitly authorizes wider formatting. Inspect the
diff and revert unrelated whitespace, import sorting, line-ending changes, or
generated-file churn.

## Repository ownership

Use repository placement to preserve architecture:

```text
utils/
  generic reusable programming models and primitives

packages/
  concrete capabilities, domain implementations, and provider integrations

registry/
  declarative definitions interpreted elsewhere

clis/ and apps/
  executable grammar, host adapters, dependency selection, and composition
```

Do not fix a dependency cycle by creating `shared/`, `common/`, `misc/`, or an
oversized universal `core`/`runtime` package. Move the actual generic contract to
`utils/` only when it can be described without the concrete domain.

Libraries must remain import-safe. Importing a package must not configure
logging, read project configuration, install signal handlers, start timers,
launch processes, or acquire unrelated resources.

Do not preserve obsolete compatibility paths unless the user explicitly asks
for compatibility. A replacement is complete only after current consumers,
tests, exports, docs, configuration, persisted data, generated artifacts, and
user flows use the new path and the obsolete path is removed.

## Runtime ownership and cancellation

Name ownership directly.

- `AbortSignal` communicates cooperative cancellation.
- `Disposable`, `AsyncDisposable`, `using`, `await using`, and disposal stacks
  communicate cleanup and resource ownership.
- An injected resource is borrowed unless ownership transfer is explicit.
- An observable/event stream communicates observation, not ownership,
  cancellation, durability, or authoritative state by itself.
- A Promise for one terminal fact should not be replaced by an event that a late
  subscriber can miss.

Document who closes the resource and what happens when cancellation races with
completion, retries, writes, or disposal.

## Established tool choices

These are strong defaults only where the repository or capability has selected
that ecosystem. They are not reasons to add dependencies to unrelated projects.

### Deno and Web APIs

Prefer the same production TypeScript source across supported runtimes. When
semantics are equivalent, prefer:

1. Web platform APIs.
2. `@std/*` packages.
3. Existing focused `@utils/*` programming models.
4. Established focused third-party libraries.

Keep Deno-specific process, permission, filesystem, and stdout/stderr behavior
behind adapters when a library is intended to work in Node, browsers, workers,
or Bun too.

### LogTape

When LogTape is the repository logger:

- libraries emit structured records; applications configure sinks, filters,
  formatters, and routing;
- preserve structured properties instead of interpolating away machine-readable
  data;
- retain successful evidence when it is useful for diagnosis or audit; summaries and rate controls can reduce noisy diagnostic rendering without erasing the underlying record policy;
- use rate controls and lazy expensive properties for hot paths;
- treat redaction as a route-specific data policy: audit the actual logger call sites and the output's audience before applying it; over-redaction can remove the exact non-secret value needed to debug a failure;
- give stable user-requested results, exports, and support bundles their own schema and exposure policy instead of blindly inheriting diagnostic-sink redaction;
- use `@logtape/testing` for logger assertions where applicable;
- keep durable record writers separate from transient diagnostic sinks;
- keep reusable result and diagnostic writers runtime-neutral when code can run outside Deno; do not bake `Deno.stdout` or `Deno.stderr` into a reusable CLI contract;
- retain a project formatter that already communicates the domain well rather than replacing it with `@logtape/pretty` only for ecosystem conformity; treat the pretty package as a useful reference or fallback, not an automatic replacement;
- in current LogTape 2.3.x, a plain `Sink` is synchronous; use `AsyncSink` with `fromAsyncSink()` when reusable output requires asynchronous I/O or backpressure, and close it through the asynchronous logging lifecycle.

### Optique

When Optique owns a CLI, let it own token grammar, choices, aliases, typo suggestions, help, completion, manuals, and parser-visible source composition. Use `@optique/logtape` when its logging grammar fits the repository instead of duplicating level, verbosity, destination, or format parsing in a second option system. Optique is project-selected rather than a universal runtime dependency; a project that deliberately owns a native parser keeps that parser authoritative.

### Unplugin and build-tool ecosystems

Treat Unplugin, Oxc, and similar tool families as ecosystems to inspect before building custom adapters. When a repository has selected Oxc for parsing, transforms, linting, or build work, reuse that maintained owner instead of introducing Babel or another parallel compiler stack without a concrete capability gap. Reuse maintained Unplugin integrations when they match the actual host and behavior. Do not add either ecosystem solely because another project uses it. Verify generated output and the actual runtime/build path.

### mise

When a repository uses mise as its task/CI authority, run and update the mise
workflows rather than inventing parallel ad-hoc commands. Keep the underlying
commands individually understandable so failures can still be diagnosed.

## Tests, benchmarks, and completion

A green type check is not completion.

Use the repository's canonical gates. For the current Deno-first projects, the
complete changed-surface review can include:

- formatting;
- linting;
- strict type checks;
- `node:test` tests with `@std/expect` where that is the repository test model;
- Deno runtime tests and permission checks where Deno behavior matters;
- browser/worker/Node/Bun probes for claimed runtimes;
- conformance and differential suites for parsers/protocols;
- `mitata` or repository benchmark suites for performance claims;
- builds, bundles, compiled artifacts, package tarballs, and clean consumers;
- generated output and documentation validation;
- runtime smoke tests and the actual user flow;
- resource cleanup, cancellation, retry, recovery, and retained-memory checks
  when the change affects lifecycle.

For large-scale data or crawler work, test the representative data shape and
volume, not only tiny fixtures. Keep benchmark correctness oracles and raw
samples when the benchmark can influence architecture.

Report each check as `passed`, `failed`, `blocked`, or `not applicable`. Do not
collapse blocked verification into success.
