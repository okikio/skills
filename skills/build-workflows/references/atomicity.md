# Atomicity, idempotency, and reconciliation

## Transaction boundaries

Use one database transaction when execution creation, initial timeline append,
and queue insertion must either all commit or all disappear. Define unique
constraints for logical/idempotency identities and retry transaction conflicts.

Allocate timeline sequence with a database-safe mechanism: sequence, locked
counter, atomic update, or constraint/retry. Never derive it from an unlocked
read count.

## Cross-system gaps

Runtime start, database projection, external API effect, and queue acknowledgement
usually cannot share one transaction. For each gap define:

- idempotent operation key;
- persisted intent and observed result;
- retry behavior;
- duplicate response handling;
- reconciliation query;
- operator repair path;
- safe terminal state.

## Crash table

Test crashes:

- after execution insert but before enqueue;
- after engine start but before recording external ID;
- after effect success but before acknowledgement;
- after wait timeout state but before resume enqueue;
- after projection update but before timeline append;
- during cancellation and cleanup.

The retry or repair must converge to one logical outcome. “At least once” does
not excuse duplicate non-idempotent effects.

## Idempotency scope

Name the scope and retention of keys. A key may be unique per tenant/workflow,
per endpoint, or globally. Store enough request identity to detect a reused key
with a conflicting payload.

## Reconciliation

Run reconciliation continuously or on demand for stuck leases, missing queue
items, engine/database disagreement, incomplete projections, and partial sinks.
Record repairs in the audit timeline rather than mutating state invisibly.
