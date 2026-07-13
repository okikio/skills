---
name: build-data
description: Design data architecture, databases, analytics, schemas, migrations, ingestion, querying, projections, and ORM integrations. Use with PostgreSQL, ClickHouse, Drizzle, DuckDB, JSONL, Parquet, and custom dialects or adapters.
---

# Build Data

Use `explore-ecosystems` before selecting clients, adapters, engines, or ORM
packages. Classify workloads first.

1. Separate operational ownership, analytical events, durable evidence, and
   searchable projections. Do not force OLTP and OLAP into one abstraction.
2. Define schemas, keys, ordering, partitions, retention, deduplication,
   nullability, and evolution from query/recovery needs.
3. Prove migration generation/application, seeding, queries, inserts, and
   transactions separately.
4. Do not infer support from API resemblance. Inspect custom adapters locally;
   never invent exports or guarantees.
5. Verify volume, duplicates, late data, schema evolution, recovery, and
   representative queries.

Read [stack.md](references/stack.md).
