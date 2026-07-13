---
name: use-okikio
description: Research and use Okikio-maintained libraries and project patterns without inventing private APIs. Use for @okikio packages, custom ClickHouse Drizzle work, backend utilities, service modules, observables, SPARQL, undent, and related personal libraries.
---

# Use Okikio

Treat every package as an ecosystem hypothesis, but verify identity from the
workspace, registry, and source before use.

1. Inspect manifests, exports, schemas, tests, examples, releases, siblings, and
   consumers.
2. Prefer installed source over remembered APIs. Never invent private or custom
   adapter exports.
3. Preserve schema-first Zod v4 contracts, concise names, LogTape diagnostics,
   and executable verification.
4. Reuse backend utilities/service patterns only when local contracts match.
5. State uncertainty and the exact inspection needed to resolve it.

Read [catalog.md](references/catalog.md).
