---
name: build-workflows
description: Design and implement durable workflows, jobs, queues, pipelines, ingestion stages, retries, resumability, idempotency, and recovery. Use with Temporal, scheduled jobs, Common Crawl or WARC processing, events, and multi-stage pipelines.
---

# Build Workflows

Start from failure and recovery semantics. Use `explore-ecosystems` for engine
and queue decisions.

1. Define durable/transient state, ownership, stage contracts, and completion.
2. Give runs/work stable identities. Make retryable effects idempotent or
   explicitly deduplicated.
3. Specify timeout, retry, cancellation, backpressure, rate limits, checkpoints,
   replay, and poison-item behavior.
4. Keep replayed orchestration deterministic and isolate side effects.
5. Preserve provenance across observations, evidence, derived records, and
   projections. Never call an in-memory promise chain durable.
6. Verify interruption/resume, duplicate delivery, partial failure, and operator
   recovery.

Read [durability.md](references/durability.md).
