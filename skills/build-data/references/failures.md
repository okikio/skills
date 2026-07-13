# Data failure signatures

| Signature | Likely defect | Required evidence |
|---|---|---|
| One store handles transactions and high-volume analytics through one model | OLTP/OLAP ownership collapsed | Workload and recovery map |
| Search/graph store called source of truth without rebuild policy | Projection authority unclear | Authoritative source and reconciliation |
| Drizzle-like API assumed to support transactions/migrations | Adapter shape mistaken for dialect support | Source, generated SQL, executable tests |
| Migration generates but clean install fails | Generation treated as application proof | Empty and upgrade database tests |
| Driver hidden behind DB object | Shutdown owner missing | Close/drain handle test |
| Raw DB message reaches client | Boundary leak | Stable problem and redacted cause |
| README and deployment name different graph engines | Documentation/source drift | Active manifests and query endpoint |
| Dual write partially succeeds | No durable projection protocol | Outbox/change identity and reconciliation |
| Pipeline reports success after sink failure | Required/optional state missing | Per-sink manifest and resume |
| JSONL append resumes at attempted offset | Checkpoint precedes commit | Committed output identity |
| All records retained for a statistic | Unbounded memory | Batch/stream oracle |
| Count is labeled exact but uses relation estimate | Query contract false | Explicit count strategy |
| Cursor repeats/skips under writes | Order lacks stable tie-breaker/context | Concurrent pagination test |

Correct the owner and recovery contract before adding another abstraction layer.
