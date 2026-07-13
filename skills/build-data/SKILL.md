---
name: build-data
description: Design, implement, migrate, review, diagnose, or verify data architecture, operational databases, analytical stores, search and graph projections, schemas, migrations, query layers, ingestion artifacts, and ORM or driver integrations. Use for PostgreSQL, ClickHouse, Drizzle, DuckDB, Typesense, QLever, Blazegraph, SPARQL, JSONL, Parquet, custom dialects, pagination, counts, retention, deduplication, and schema evolution.
---

# Build data systems

Classify workload and authority before choosing an engine or abstraction. When
active, `build-workflows` owns durable coordination and `build-apis` owns request
contracts. Otherwise preserve those boundary checks locally. This skill owns
data stores, models, queries, migrations, and projections.

## Ownership preflight

For every data set, record:

- authoritative source and rebuildable projections;
- workload: transactional, analytical, search, graph, stream, artifact, or cache;
- keys, uniqueness, ordering, partitioning, retention, and deletion;
- schema and migration owner;
- volume, rate, latency, consistency, and concurrency;
- late, duplicate, corrected, and missing data behavior;
- query and recovery paths;
- connection, transaction, close, and deployment lifetime;
- privacy, tenancy, access, redaction, and audit requirements.

Do not force OLTP and OLAP through one abstraction. Do not infer behavior from an
ORM-shaped API or a repository README that contradicts the deployed query path.

## Procedure

1. Assign PostgreSQL, ClickHouse, search, graph, files, and caches distinct roles.
2. Define schemas from queries, constraints, evolution, and recovery needs.
3. Inspect the exact driver/dialect/adapter source, exports, generated SQL, and
   tests. Prove transactions, migration generation, migration application,
   seeding, query, insert, and shutdown separately.
4. Keep authoritative writes and projection updates connected through durable
   events, outbox/change capture, idempotent ingestion, and reconciliation.
5. Make pagination order stable and count strategy explicit.
6. Make artifacts versioned, attributable, bounded, and replayable.
7. Verify duplicates, late data, schema changes, partial projection failure,
   representative volume, recovery, and clean rebuilds.

## Reference routing

- [storage-ownership.md](references/storage-ownership.md): workload and engine
  decision model.
- [postgres-drizzle.md](references/postgres-drizzle.md): transactional schemas,
  Drizzle, migrations, drivers, and resource lifetime.
- [clickhouse.md](references/clickhouse.md): analytics, MergeTree design,
  ingestion, deduplication, mutation, and custom adapters.
- [projections.md](references/projections.md): Typesense, QLever/Blazegraph,
  synchronization, rebuild, and reconciliation.
- [artifacts.md](references/artifacts.md): JSONL, Parquet, raw evidence,
  manifests, schema versions, and bounded processing.
- [queries.md](references/queries.md): filters, sorts, cursors, counts, and safe
  query construction.
- [failures.md](references/failures.md): evidence-grounded failure signatures.

Completion requires representative reads and writes plus failure/recovery proof,
not only a migration or typecheck.
