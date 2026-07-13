# Query contracts

## Safe construction

Parse public filters, sorts, selected fields, and pagination into a validated
query specification. Map approved public fields/operators to expressions. Do not
interpolate arbitrary identifiers or predicates.

Apply server-owned tenant, visibility, and lifecycle filters before user input.
Keep transport syntax separate from storage-specific execution.

## Pagination

Cursor pagination requires a stable total order with a tie-breaker and an encoded
identity tied to relevant filter/order/version context. Offset pagination may be
adequate for bounded/admin views but can shift under concurrent writes.

Test duplicates, deletions, inserts between pages, invalid/expired cursors, empty
pages, descending and compound sorts, and tenant isolation.

## Count choices

Use exact counts only when correctness and cost justify them. Planner estimates
should reflect the active filtered query; relation estimates are coarse hints.
Omit counts where continuation is sufficient. Name the mode in the API contract.

## SPARQL

For SPARQL, separate query construction, parameter/value serialization,
transport, result parsing, domain mapping, pagination, and engine error handling.
Use an inspected builder such as `@okikio/sparql` only from actual exports. Keep
query preview safe and redact credentials/endpoints where necessary.

## Verification

Inspect generated SQL/SPARQL, run representative datasets and query plans,
exercise malformed filters and engine failures, and compare exact/estimated
count semantics. Type-level builders do not replace execution.
