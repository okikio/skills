# Codex SkillOpt-style iteration 9

## Scope

This iteration rebuilt the shallow workflow skills from the retained uploaded
guidebooks and codebase archives. Three independent domain passes covered CLI
ecosystems, backend/workflow systems, and data/web/personal libraries. The root
agent retained ownership of cross-skill boundaries, provenance, acceptance, and
the final diff.

No Markdown formatter was run. New prose was added with narrow patches, and
existing author wrapping was preserved.

## Optimization objective

The acceptance bar was not package-name recall or document length. A reference
had to let an agent decide and implement without inventing an API. Material
references therefore include:

- ownership and connected-system boundaries;
- package or monorepo topology;
- observed, normative, inferred, experimental, and unresolved status;
- configuration and integration order;
- concrete code or contract shapes;
- counterexamples and deliberate exclusions;
- failure signatures and the next inspection step;
- validation and executable verification;
- primary sources, attachment paths, freshness, and version limits.

## Accepted changes

- Added deep Optique, LogTape, c12/defu/jiti, focused UnJS, and end-to-end CLI
  integration manuals.
- Rebuilt service modules as reachable architecture containing definitions,
  schemas, handlers, clients, middleware, workflow registration, health, and
  independent deployment contracts.
- Added Effect service/Layer/error/Scope guidance and kept it distinct from
  durable execution.
- Added evidence-bounded `@effect/workflow` guidance. The uploaded in-memory
  path is described as test evidence; the non-implemented SQL adapter remains
  explicit counterevidence to production durability.
- Added Temporal TypeScript process, determinism, Activity, message, timeout,
  cancellation, versioning, and operations guidance without claiming Temporal
  exists in the uploaded repositories.
- Added durable control-plane, outbox/inbox, lease/fencing, checkpoint,
  recovery, reconciliation, pipeline, and workflow-event/SSE contracts.
- Added ClickHouse physical internals, Drizzle architecture, and a custom
  ClickHouse Drizzle-like adapter design grounded in the attached local source.
- Added Astro Icon versus Unplugin Icons and Astro Fonts API versus direct
  Fontsource decision manuals, including renderer, bundling, fallback, privacy,
  and deployment behavior.
- Added Solid Primitives, TanStack, Better Auth, `@okikio/observables` 1.4.0,
  `@okikio/sparql` 0.0.2, Undent, and experimental Wikitext manuals.
- Kept root skills compact and routed the deep material selectively.

## Rejected changes

- Concatenating all manuals into each root skill.
- Treating every remembered library as verified or installed.
- Inventing an import specifier or public export map for the private ClickHouse
  adapter.
- Calling Effect services, retry loops, queues, or an in-memory workflow engine
  durable without process-loss and restart evidence.
- Claiming immediate uniqueness, transactions, or exactly-once behavior from
  ClickHouse or cross-system retries.
- Treating client session state as authorization authority.
- Treating Astro, Solid, TanStack, Better Auth, LogTape, or any UnJS package as
  mandatory when repository evidence selects another owner.
- Using document size as evidence that a capability is complete.

## Result

The rebuilt manuals are materially deeper and make evidence status explicit.
This iteration establishes candidate behavior and reference-specific evals; it
does not claim a measured pass-rate improvement or cross-model transfer result.
Those claims require isolated rollouts against the same fixtures and model
versions.
