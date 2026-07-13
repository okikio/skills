---
name: use-okikio
description: Research, select, integrate, review, or debug Okikio-maintained libraries and recurring project patterns without inventing private APIs. Use for @okikio/undent, @okikio/wikitext, @okikio/sparql, remembered observables packages, backend endpoint/query/response/database utilities, service modules, workflow control-plane utilities, custom ClickHouse Drizzle work, package generation, and related personal repositories.
---

# Use Okikio libraries and patterns

Treat every remembered package as an ecosystem hypothesis. Exact exports and
current consumers outrank memory, plans, and names.

## Package status gate

Classify the target before writing usage code:

- published and verified: versioned export exists and tests exercise it;
- experimental: prerelease/`0.0.0`, active experiment, or incomplete surface;
- documented but not implemented;
- local/private and inspectable;
- remembered name only and unverified.

Use this source order:

1. current export map and public entrypoint;
2. executable tests;
3. package manifest and version;
4. current source examples and consumers;
5. README and documentation;
6. plans, archived repositories, and memory.

Do not claim availability above the strongest evidence.

## Procedure

1. Resolve exact spelling, repository, workspace package, version, exports,
   runtime, license, maturity, and consumers.
2. Inspect sibling packages and related repositories, but include only coherent
   capability owners.
3. Map the public API from source and tests. Distinguish declared types,
   experimental code, unexported helpers, and executable behavior.
4. Match the local repository's schema, logging, configuration, resource, and
   composition contracts. Reuse a pattern only when those contracts align.
5. Preserve Zod v4 schema-first boundaries, LogTape process output, explicit
   resource lifetime, and source-grounded verification.
6. If source is unavailable, state the exact inspection needed and offer an
   interface or discovery plan, not invented imports.

## Reference routing

- [undent.md](references/undent.md): exact text-dedentation, interpolation,
  alignment, newline, and Unicode display-width choices.
- [wikitext.md](references/wikitext.md): token/event/tree cost ladder,
  diagnostics, sessions, maturity, and missing exports.
- [backend.md](references/backend.md): service modules, endpoint, validation,
  query, response, server, database, and auth patterns.
- [workflows.md](references/workflows.md): control-plane and durable-workflow
  patterns plus incomplete reachability and atomicity warnings.
- [sparql.md](references/sparql.md): inspected SPARQL query/execution boundary.
- [packages.md](references/packages.md): packaging, generation, benchmarks, and
  unverified-package protocol.

Compose with the appropriate workflow skill. This skill supplies exact personal
library knowledge; it does not replace API, data, workflow, CLI, or delivery
ownership.
