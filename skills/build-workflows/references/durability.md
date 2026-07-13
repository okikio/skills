# Durability decisions

Choose an engine when durable timers, replay, signals, long coordination, or
cross-process recovery justify its cost. Inspect SDKs, workers, persistence,
versioning, testing, observability, and deployment. For ingestion, separate
discovery, fetch, decode, observe, detect, derive, load, aggregate, and project.
Checkpoints mean committed work, not attempted work; caches and manifests need
versioned identity and invalidation.
