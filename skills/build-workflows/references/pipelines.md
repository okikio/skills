# Resumable data pipelines

## Stage model

For ingestion, separate discovery, fetch, decode, observe, detect, derive, load,
aggregate, index, and project as applicable. Each stage needs input/output schema,
identity, provenance, error policy, checkpoint, and required/optional status.

Retain raw evidence when replay, audit, or improved parsing matters. Derive
normalized records and projections reproducibly.

## Bounded execution

Stream or batch with explicit limits. Do not retain every record for profiling
inside a nominally streaming job. Bound memory, open files, concurrent requests,
queue depth, and sink batches.

## Checkpoints

A checkpoint represents committed output, not attempted input. Include run ID,
source identity/version, stage version, offset/key, output manifest, and schema
version. Reject incompatible resumes or run an explicit migration.

## Multiple sinks

PostgreSQL, ClickHouse, Typesense, graph stores, JSONL, and Parquet writes are
separate commits unless proven otherwise. Record per-sink state in a completion
manifest. A run succeeds only when every required stage and projection is
complete. Optional failures remain visible.

## Error policy

Do not catch broad exceptions and continue without accounting. Classify skip,
retry, quarantine, fail-run, and best-effort outcomes. Persist rejected items and
causes safely enough for inspection and replay.

## Verification

Interrupt between stages and sink commits, resume from checkpoints, inject
duplicate and malformed inputs, fail one sink, reorder/late-deliver records, and
measure memory against a large synthetic source.
