# Data ecosystem map

PostgreSQL is normally the transactional system of record; ClickHouse serves
columnar analytics and needs explicit engines, ordering, partitions, and
mutation costs; DuckDB serves local/in-process analytics. JSONL and Parquet
differ in streaming, schema, compression, and interoperability. For Drizzle,
inspect ORM, Kit, dialect, migrator, schema, and driver boundaries. A
MySQL-shaped API does not establish ClickHouse semantics.
