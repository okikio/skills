# ClickHouse analytics and custom adapters

## Table design

Choose engine, ordering key, primary-key index, partitioning, retention/TTL,
compression/codecs, and projections/materialized views from query and ingestion
patterns. An ordering key is a physical access/deduplication decision, not an
OLTP uniqueness constraint.

Define event identity, version/correction semantics, late arrival, duplicate
handling, batch size, async insert behavior, and mutation/deletion cost.

## PostgreSQL relationship

PostgreSQL can own organizations, billing, workflow state, and other transactional
records while ClickHouse owns observation analytics. Define the durable event or
outbox/change-capture path, projection lag, retry, backfill, and reconciliation.
Avoid dual writes without a repair contract.

## Custom Drizzle-shaped adapter

Inspect actual source and exports for dialect, table/column builders, SQL
generation, session, driver, query, insert, migrator, and Kit integration. Prove
each capability independently. A MySQL-shaped session or familiar query builder
does not establish ClickHouse transactions, constraints, returning behavior, or
migration semantics.

Do not invent private adapter APIs. If source is unavailable, state the exact
inspection required and use the native client/query surface supported by evidence.

## Verification

Capture generated DDL/SQL, create a clean database, apply schema, seed, batch
insert, query representative filters/aggregates, inject duplicates and late
records, exercise retention/corrections, and test failure/retry/backfill. Measure
with representative cardinality and ordering, not a one-row smoke test.
