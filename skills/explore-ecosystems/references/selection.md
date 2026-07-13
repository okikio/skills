# Selection and capability ownership

## Start from the capability graph

List the capabilities the task actually needs, then map each to its current and
candidate owner. Typical owners include command grammar, configuration loading,
schema validation, logging transport, rendering, routing, server state,
authentication, authorization, persistence, migrations, and durable execution.

Prefer one canonical owner per concern. Two tools may coexist only when the
boundary is explicit, for example:

- Zod owns application schemas while Standard Schema is an interoperability
  boundary;
- LogTape owns process results and diagnostics while a stage writer owns durable
  JSONL artifacts;
- PostgreSQL owns transactions while ClickHouse owns analytical projections;
- Astro owns page rendering while Solid owns an interactive island.

## Inclusion test

Include a package when all are true:

1. a required capability has no adequate existing owner;
2. the package's identity and relationship are verified;
3. its version and runtime fit the repository;
4. its operational cost is understood;
5. its integration can be verified;
6. it does not create an unexplained second source of truth.

## Exclusion record

Record plausible siblings and alternatives that were considered but excluded.
Common valid reasons include duplicate ownership, wrong runtime or renderer,
experimental status, unsupported dialect, redundant configuration, excess
deployment cost, or no current use case.

Do not install every sibling to demonstrate ecosystem awareness. The goal is a
coherent system, not maximal package count.

## Alternative versus companion

Distinguish these deliberately. Consola and LogTape may be alternative logging
owners; Citty and Optique may be alternative command parsers. An official
Optique-to-LogTape adapter is a companion because it connects different owners.

If two candidates overlap, compare behavior, maturity, ecosystem fit, migration
cost, failure modes, and existing repository ownership before selecting one.
