# PostgreSQL and Drizzle

## Transactional model

Use database constraints for identities and invariants that must hold under
concurrency. Define foreign keys, unique indexes, checks, nullability, defaults,
timestamps, deletion, tenant ownership, and transaction boundaries explicitly.

## Drizzle ecosystem

Inspect ORM, Kit, dialect, driver, schema, migrator, relational/query APIs, and
generated artifacts at the installed versions. In a workspace, central re-export
can prevent incompatible duplicate class instances, but it becomes an explicit
dependency and version owner.

Prove separately:

- schema/type generation;
- migration generation;
- migration contents and review;
- application against an empty database;
- upgrade from a representative prior schema;
- rollback or forward repair policy;
- seeding and idempotency;
- representative query and insert;
- transaction and isolation behavior;
- connection close/drain.

## Resource lifetime

Separate database construction from environment loading. Avoid import-time
connections and global logger configuration. The composition root should own the
underlying driver/pool handle and make shutdown reachable for tests, workers,
CLIs, and graceful server termination.

## Error policy

Map unique, foreign-key, serialization, timeout, unavailable, and unexpected
errors to stable domain/API failures. Do not put raw SQL/driver messages in
client responses. Keep redacted causes and correlation in diagnostics.

## Concurrency verification

Test idempotent creates, uniqueness races, sequence allocation, pagination under
writes, transaction rollback, deadlock/serialization retries, pool exhaustion,
and shutdown with in-flight work.
