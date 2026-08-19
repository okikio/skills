# PostgreSQL and Drizzle operational design

Use this reference for PostgreSQL schema, Drizzle ORM runtime, Drizzle Kit migrations, `postgres.js` client ownership, cross-schema relations, concurrency, and production verification. Treat Drizzle's schema types, query runtime, driver, and Kit artifacts as related but distinct systems.

## Contents

- Ownership layers
- PostgreSQL invariant model
- Tenant and cross-schema design
- Drizzle schema and import ownership
- Client, session, and lifetime
- Configuration model
- Migration workflow
- Transactions and concurrency
- Error policy
- Integration sequence
- Failure and repair
- Test matrix
- Executable verification
- Deliberate exclusions
- Sources and freshness

## Ownership layers

| Layer | Owns | Does not prove |
|---|---|---|
| PostgreSQL schema | tables, columns, constraints, indexes, policies | application query scoping or migration success |
| Drizzle schema metadata | typed table/column/relation declarations | installed database state |
| Drizzle query builder/dialect | SQL AST and compilation | driver connectivity or plan quality |
| Driver/session | execution, parameters, result mapping, transactions | schema migration history |
| `postgres.js` | pool, sockets, prepared behavior, shutdown | Drizzle relational semantics |
| Drizzle Kit | snapshot/diff/generate/migrate tooling | reviewed correctness or rollback |
| Composition root | config, construction, logging adapter, readiness, close/drain | business authorization |

Avoid treating `db` as a magic unit that owns everything. The underlying client/pool must remain reachable for lifecycle and driver-specific behavior.

## PostgreSQL invariant model

Put concurrency-sensitive invariants in PostgreSQL when it is the authority:

- primary keys and stable identity;
- `NOT NULL` and explicit defaults;
- unique constraints for business/idempotency keys;
- foreign keys and deletion/update actions;
- check constraints for bounded state machines and value rules;
- exact numeric precision/scale for money plus explicit currency;
- timestamp timezone and clock-owner policy;
- exclusion constraints where range overlap is the invariant;
- transactions and isolation for multi-row state transitions.

Application validation improves errors but does not replace database constraints under concurrency.

The retained finance schema separates `auth`, `finance`, and `workflows`; finance rows include `organization_id`; money uses `numeric(19,4)` with currency; state-like text fields have checks; and cross-schema relationships are explicit. Those are observed patterns, not universal table names.

## Tenant and cross-schema design

For tenant-owned relationships, consider composite keys so the database can prevent cross-tenant references:

```ts
const account = finance.table('account', {
  id: text().primaryKey(),
  organizationId: text('organization_id').notNull(),
}, (t) => [
  unique('account_org_id_uq').on(t.organizationId, t.id),
])

const entry = finance.table('entry', {
  organizationId: text('organization_id').notNull(),
  accountId: text('account_id').notNull(),
}, (t) => [
  foreignKey({
    columns: [t.organizationId, t.accountId],
    foreignColumns: [account.organizationId, account.id],
  }),
])
```

PostgreSQL foreign keys target a primary key, unique constraint, or another supported unique key shape. The retained finance guide documents a real issue: a standalone unique index was not the right ownership when another table referenced the composite columns; use a table `UNIQUE` constraint for referenced key semantics. Do not duplicate `.unique()` and `uniqueIndex()` on the same columns.

Database-level tenant integrity does not replace authorization. Queries must still bind the current authorized organization and resource.

## Drizzle schema and import ownership

In monorepos, establish one dependency/version owner for Drizzle. The retained finance package exposes a central `@utils/db/drizzle` surface because Drizzle classes with private/protected fields can become TypeScript-incompatible when separate packages resolve different copies. Verify whether the consumer has this failure before centralizing imports, but avoid mixed versions and duplicate runtime class identities.

Separate exports:

```text
@app/db              runtime factories
@app/db/schema       schema aggregate
@app/db/schema/auth  bounded schema surface
@app/db/drizzle      controlled ORM/core symbols if needed
@app/db/types        public runtime types
```

Do not create broad re-exports that accidentally make internal tables or unstable ORM internals a public package contract. Keep schema import paths used by Drizzle Kit stable and inspect the generated snapshot after moves.

Drizzle relations are application query metadata, not PostgreSQL foreign keys. Define both when both behaviors are needed and verify generated SQL for actual constraints.

## Client, session, and lifetime

The composition root should own the client and Drizzle wrapper:

```ts
interface DatabaseResource<DB, Client> {
  db: DB
  client: Client
  close: (options?: { timeoutSeconds?: number }) => Promise<void>
}

function createDatabaseResource(config: DatabaseConfig): DatabaseResource<Database, Sql> {
  const client = postgres(config.url, {
    max: config.maxConnections,
    prepare: config.prepare,
    connect_timeout: config.connectTimeoutSeconds,
    idle_timeout: config.idleTimeoutSeconds,
  })
  const db = drizzle({ client, schema, logger: config.logger })
  return { db, client, close: () => client.end({ timeout: 5 }) }
}
```

Use the installed driver's exact option and close signatures. This example is an ownership shape, not a copy-paste API guarantee.

Decide:

- pool maximum relative to replicas/workers and database limit;
- prepared statements behind transaction/session poolers;
- connect, idle, statement, and pool wait timeouts;
- TLS and certificate verification;
- application name and server settings;
- retry boundary;
- health/readiness query;
- shutdown order and in-flight drain;
- query logging/redaction owned by the application's observability layer.

The retained `createDatabase()` constructs the client internally and returns only Drizzle. That can hide `client.end()`; repair the ownership rather than assuming the wrapper closes itself. It correctly separates optional LogTape sink configuration from database construction in the newer client file, while the retained server contains import-time logging configuration as a counterexample. Do not force LogTape if the consumer selected another observability owner.

## Configuration model

Validate lazily at the composition boundary:

```ts
interface DatabaseConfig {
  url: string
  maxConnections: number
  prepare: boolean
  connectTimeoutSeconds: number
  idleTimeoutSeconds: number
  statementTimeoutMs: number
  ssl: 'disable' | 'require' | 'verify-full'
  logQueries: boolean
}
```

Importing schema or types should not require environment access, open a connection, or configure global logging. Tests and CLIs should be able to inject an explicit URL/client. Redact credentials from errors and diagnostic configuration.

The retained package defaults `max` to 10 and `prepare` to false. Those are repository choices, not universal defaults. Derive them from the actual database/proxy/replica topology.

## Migration workflow

The retained finance package uses:

```ts
defineConfig({
  out: './drizzle',
  schema: './schemas',
  dialect: 'postgresql',
  dbCredentials: { url: DATABASE_URL },
})
```

At the consuming version, confirm config keys and CLI behavior. The operational sequence is:

1. Change executable TypeScript schema.
2. Run pinned Drizzle Kit generation from the owning package/directory.
3. Inspect SQL, snapshot, and journal changes.
4. Review constraints, defaults, casts, backfills, locks, and destructive operations.
5. Apply to an empty disposable database.
6. Upgrade representative previous schemas/data.
7. Run application reads/writes and invariant tests.
8. Measure lock/duration implications for production-sized data.
9. Define rollback or forward-repair procedure.
10. Commit schema and generated artifacts together.

Use generated SQL migrations as reviewed history. `push` can be useful for disposable exploration but bypasses the same reviewed artifact sequence; do not use it as durable production history by accident.

If intentionally rebuilding the baseline, remove/regenerate the complete migration metadata set coherently. The retained guide notes that deleting only parts of `drizzle/meta` can leave a missing journal. Never repair migration state by guessing which generated files are disposable.

## Transactions and concurrency

Define transactions around authoritative state transitions, not repository method count. Test the actual driver/dialect transaction API and isolation.

Patterns requiring special attention:

- idempotent create: unique key plus insert/conflict or transaction, not read-then-insert;
- monotonic per-parent sequence: database-owned sequence/counter/locked row, not `existing.length + 1`;
- queue claim: one atomic claim such as `FOR UPDATE SKIP LOCKED` or conditional update with proven selection behavior;
- balance/ledger changes: immutable entries and transactionally maintained projections where applicable;
- outbox: business state and change record in the same transaction;
- serialization/deadlock: bounded retry of the entire safe transaction with jitter and observability;
- savepoints/nested transactions: verify installed behavior rather than assuming.

Drizzle transaction types do not establish that a custom adapter or serverless driver supports every PostgreSQL behavior.

## Error policy

Classify at the database boundary:

| Category | Example response policy |
|---|---|
| unique/check/foreign-key | stable conflict/unprocessable domain error after identifying owned constraint |
| serialization/deadlock | retry whole transaction if safe and within budget |
| statement/lock timeout | stable unavailable/timeout; preserve retry metadata internally |
| connection/pool unavailable | readiness/availability failure, not invalid client input |
| migration mismatch | fail startup or capability readiness explicitly |
| unexpected driver error | generic client problem; redacted structured cause internally |

Do not send raw SQL, connection URLs, table layout, or driver messages to clients. Avoid parsing human messages when stable error codes/constraint names are available.

## Integration sequence

```text
composition root parses config
  -> constructs owned postgres.js client
  -> wraps it in Drizzle with one schema/version
  -> verifies readiness/migration compatibility
  -> injects DB capability into services/workers
  -> runs parameterized transactions/queries
  -> maps stable database errors
  -> stops intake, drains work, closes client
```

Schema release:

```text
schema edit -> generate -> review SQL/snapshot -> empty install -> upgrade fixture
  -> application integration -> production rollout/observe -> forward repair if needed
```

## Failure and repair

| Signature | Defect | Repair evidence |
|---|---|---|
| Migration generates but clean install fails | generation treated as application proof | empty DB apply and schema introspection |
| Composite FK fails despite unique index | index/constraint semantics confused | named table unique constraint and applied FK |
| Second migration recreates same uniqueness | duplicate declaration | inspect schema and generated diff |
| Two packages produce incompatible Drizzle types | duplicate version/runtime identity | lockfile resolution and central version owner |
| Process hangs after tests | client close inaccessible | explicit resource close and zero open-handle test |
| Importing schema requires env | config at module scope | import-safe schema and lazy config |
| Idempotency race creates duplicates/errors | read-before-insert | database constraint and atomic insert policy |
| Queue work executes twice | claim split or lease semantics incomplete | concurrent workers and atomic claim oracle |
| Raw constraint message reaches caller | boundary leakage | stable mapping plus redacted cause |

## Test matrix

Test:

- schema import without environment/network permissions;
- config validation and credential redaction;
- connection/readiness and explicit close/drain;
- empty migration install and representative upgrades;
- generated schema matches introspected constraints/indexes;
- cross-schema and composite foreign keys;
- unique constraint versus unique-index intended ownership;
- check constraints with invalid direct SQL writes;
- transaction commit, rollback, nested/savepoint behavior if used;
- uniqueness/idempotency races with multiple connections;
- deadlock and serialization retry exhaustion;
- queue claim/lease concurrency if PostgreSQL owns work;
- tenant-isolated relationships and queries;
- pool exhaustion, database restart, statement/lock timeout;
- graceful shutdown with in-flight transactions;
- ORM query/result mapping, decimals, timestamps, arrays, JSON, and nulls;
- generated package/monorepo import identity if re-exporting Drizzle.

## Executable verification

Run pinned repository tasks, not generic commands if the project wraps Drizzle through Aube/mise/npm/Deno. The retained finance guide uses:

```bash
aube --dir utils/db db:generate
aube --dir utils/db db:migrate
```

In a disposable database, apply committed migrations, inspect `pg_constraint`, `pg_indexes`, schemas, and migration history, then run real service queries. Upgrade a copied prior schema. Run two or more concurrent clients against uniqueness and claim paths. Stop the process during in-flight work and assert the pool closes or the documented timeout expires.

## Deliberate exclusions

- Do not force Drizzle when the consumer has another selected data layer.
- Do not force LogTape, Zod, or Effect; integrate with selected owners.
- Do not import environment or connect while importing schema/types.
- Do not equate Drizzle relations with foreign keys.
- Do not equate a unique index with every semantic of a table unique constraint.
- Do not treat generated SQL as reviewed/applied/upgrade-safe.
- Do not claim custom Drizzle-like adapters support PostgreSQL transactions or Kit.
- Do not use `push` as reviewed production migration history without explicit policy.
- Do not hide the driver/pool close handle.

## Sources and freshness

Grounded in the retained new/old finance `utils/db` README, `client.ts`, `env.ts`, `drizzle.ts`, `drizzle.config.ts`, generated migration, auth/finance/workflow schemas, package manifests, and workflow PostgreSQL store, reviewed 2026-07-17. Observed package versions include Drizzle ORM 0.45.x, Drizzle Kit 0.31.x, and postgres.js 3.4.x in the uploaded package manifest; APIs and configuration are version-sensitive. Verify installed versions, lockfile resolution, generated artifacts, and real PostgreSQL behavior before copying examples.
