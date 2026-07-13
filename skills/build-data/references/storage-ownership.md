# Storage ownership

| Store | Strong default role | Required boundary |
|---|---|---|
| PostgreSQL | Transactional source of truth | Constraints, transactions, migrations, tenant policy |
| ClickHouse | High-volume analytical events and aggregates | Ordering, partitions, retention, deduplication, mutation cost |
| DuckDB | Local/in-process analytical queries and file transforms | File/schema ownership and memory/disk limits |
| Typesense | Search projection | Rebuild, alias/index replacement, lag and schema |
| QLever/Blazegraph | Graph/query projection | RDF identity, ontology provenance, engine deployment |
| JSONL | Streaming/replay/interchange evidence | Record schema, line safety, compression, manifests |
| Parquet | Typed analytical staging and batches | Schema evolution, row groups, partition layout |

These roles are starting points, not universal mandates. Make deviations
explicit from workload evidence.

## Authority and projection

Name one authoritative source for each fact. Search indexes, analytical tables,
materialized views, graph stores, and caches should have a rebuild or repair path.

Define the projection contract:

```text
authoritative commit
  -> durable change identity
  -> idempotent projector
  -> projection checkpoint
  -> lag and failure visibility
  -> reconciliation/rebuild
```

## Selection evidence

Inspect actual deployment and query code. A README can call Blazegraph primary
while the active pipeline serves QLever. A custom adapter can resemble Drizzle
without supporting transactions or Kit migrations. Names are not operational
proof.
