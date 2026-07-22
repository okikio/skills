# Codex SkillOpt-style iteration 11

## Scope

This iteration applied a second depth pass to the references that remained structurally valid but operationally shallow after the headline ecosystem work. Independent agents divided the work into web/site/application surfaces, data/API/workflow boundaries, and developer-tool/ecosystem behavior. The root pass retained acceptance, provenance, cross-skill ownership, and anti-hallucination review.

The final three read-only auditor turns exhausted the agent service quota before returning findings. Their absence was not counted as a pass. The root pass repeated the source, routing, version-boundary, code-example, absolute-claim, placeholder, and pseudocode audits locally.

No Markdown formatter was run. A normal and whitespace-insensitive Markdown diff have identical per-file insertion/deletion counts, and no changed Markdown line has trailing whitespace.

## Depth standard

A reference was not accepted merely because it named packages or listed recommendations. Material references were expanded around:

- when the reference applies and when it does not;
- repository evidence and active-entrypoint discovery;
- capability and authority ownership;
- configuration, data, lifecycle, and deployment contracts;
- concrete implementation shapes and clearly labelled application-owned pseudocode;
- compatibility and version boundaries;
- counterexamples from the uploaded codebases;
- failure signatures, likely causes, and next inspection steps;
- static validation, executable verification, failpoints, and recovery drills;
- source provenance, evidence status, and freshness.

## Accepted content changes

- Rebuilt web-surface classification around route reachability, render ownership, state authority, framework boundaries, security, accessibility, motion lifetime, assets, and browser-extension evidence.
- Rebuilt Astro site guidance around content authority, renderer and island selection, route/cache boundaries, icons, fonts, metadata, feeds, previews, deployment, and page-level verification.
- Rebuilt web-application guidance around Solid ownership, TanStack state boundaries, authentication, forms, selection semantics, mutation reconciliation, offline/error states, and hydration verification.
- Rebuilt API guidance around service definitions, handler reachability, schema authority, bindings and middleware, Effect services and Layers, authentication, query contracts, streaming, deployment, and failure behavior.
- Rebuilt workflow guidance around durable intent, queues, leases and fencing, outbox/inbox atomicity, waits and signals, Effect workflow adapters, Temporal, replay, checkpointing, recovery, pipelines, streams, and operator repair.
- Rebuilt data guidance around raw and normalized authority, manifests, JSONL/Parquet publication, PostgreSQL/Drizzle ownership, ClickHouse internals, projections, query/cursor contracts, and custom Drizzle-like adapter design.
- Rebuilt developer-tool guidance around deterministic generators, bounded mixed-ownership edits, packaging, installed execution, releases, provenance, performance, repository hygiene, Mise, and Aube.
- Rebuilt ecosystem investigation around identity, monorepo and multi-repository topology, capability ownership, compatibility, evidence strength, integration, selection, stopping rules, and unresolved claims.
- Rebuilt Okikio guidance around verified public exports, private workspace boundaries, Undent, Observables, SPARQL, Wikitext, backend utilities, and workflow prototypes without inventing package identities or production guarantees.

## Anti-hallucination corrections

- Treating every dependency as an ecosystem remains an investigation hypothesis, not a factual claim that every dependency is a monorepo.
- Effect is conditional on repository ownership and problem shape; importing Effect does not make an API or workflow durable.
- The retained SQL Effect workflow adapter is explicitly a placeholder and cannot support a production-durability claim.
- The custom ClickHouse adapter is local source evidence; no public import path or upstream Drizzle parity is invented.
- Temporal helper names that are application-owned are labelled as such.
- Astro Fonts guidance uses the stable current API boundary and keeps earlier experimental versions separate.
- Aube, UnJS, and other version-sensitive examples are pinned to inspected source and instruct the agent to verify the installed export surface.
- Uploaded prototypes and abandoned files are evidence, not automatically active architecture or endorsed patterns.

## Evaluation additions

This pass added decision-complete cases for route ownership, cache boundaries, framework lifetimes, forms, auth, artifacts, ClickHouse, PostgreSQL/Drizzle, query authority, pipelines, recovery, generators, packaging, releases, hygiene, ecosystem research, Mise, Aube, and focused UnJS clusters. Adversarial cases punish name-only architecture, invented APIs, false durability, uncontrolled output, partial artifacts, lockfile dual ownership, and broad Markdown formatting.

## Result

The candidate contains 12 skills, 142 skill Markdown files, 32,856 lines of skill Markdown, 496 evaluation cases, 68 capability records, and 61 source records. Structural size is reported only as an audit aid, not as evidence of performance. A measured pass-rate improvement and cross-model transfer claim still require isolated rollout and judge execution using the repaired harness.
