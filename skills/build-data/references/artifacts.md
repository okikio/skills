# Data artifacts and staging

## JSONL

Use JSONL for streaming, appendable, line-oriented evidence and interchange.
Define one record schema/version per line, newline escaping through serialization,
compression, file/run naming, manifests, checksums, and partial-file handling.

## Parquet

Use Parquet for typed columnar batches and interoperable analytical staging.
Define schema evolution, nullability, row-group size, partition layout,
compression, dictionary behavior, and reader compatibility.

## Raw evidence and derived records

Retain source provenance, retrieval time, content identity, parser/version, and
license/privacy constraints. Raw, normalized, derived, and projected forms should
be distinguishable and reproducible.

## Completion manifest

Record run and input identities, schema versions, stage outputs, per-sink status,
counts, rejected items, checkpoints, checksums, and completion state. Write the
manifest atomically or use an explicit in-progress/final protocol.

## Bounded processing

Stream and batch. Do not accumulate all records for profiling or deduplication
without a measured bound. Test large synthetic input, partial writes, truncated
files, resume, duplicate records, schema changes, and corrupt artifacts.
