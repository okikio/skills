# Search and graph projections

## Search indexes

Treat Typesense or another search engine as a rebuildable projection unless the
system explicitly assigns it authority. Define document identity, schema,
tokenization/faceting/sorting, bulk import, update/delete behavior, alias/index
replacement, lag, backfill, and tenant visibility.

Use versioned index names and an atomic alias switch where supported. Preserve
the previous index until the new projection is validated and rollback is safe.

## Graph stores

For QLever, Blazegraph, or another SPARQL engine, define RDF term identity,
namespaces, ontology/version provenance, serialization, bulk-load format,
inference expectations, update capability, and query endpoint ownership.

Do not choose the active engine from a README label. Inspect deployment manifests,
ingestion scripts, endpoint configuration, and consumer queries.

## Reconciliation

Record authoritative change identity, projection version, checkpoint, last
successful item/range, rejected records, and validation summary. Compare source
and projection counts/hashes or domain invariants. Support targeted repair and
full rebuild.

## Failure behavior

A required projection failure keeps the run incomplete. An optional projection
failure remains visible with retry and operator action. Never swallow a sink
exception and report global success.
