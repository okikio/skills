# Workflow failure signatures

| Signature | Why it is incomplete | Next proof |
|---|---|---|
| Definition and types exist | Authored only | Registry and active start path |
| Runtime adapter exists | May be unreachable | Worker boot and dispatch |
| Database tables exist | Persistence schema only | Transactional state transition |
| Dispatcher returns zero | Scaffold | Work claim and execution test |
| HTTP path uses legacy control plane | New system not reachable | Route-to-control-plane trace |
| Sequence is `existing.length + 1` | Concurrent collision | Atomic sequence allocation test |
| Start does read then insert | Idempotency race | Unique constraint and concurrent test |
| Claim reads then updates | Lease race | Atomic claim primitive |
| Wait marked resolved before enqueue | Crash can orphan resume | Transaction or reconciler |
| Engine start and DB update are separate | Cross-system gap | Idempotent start and repair |
| Exceptions are caught and passed | False success and lost evidence | Explicit stage error accounting |
| All records retained for profiling | Unbounded memory | Batch-bounded memory oracle |
| Multiple sinks have no manifest | Partial success is invisible | Per-sink state and resume |
| Retry exists | Process loss still loses state | Restart against durable store |

The correction is not more workflow terminology. Prove reachability, atomicity,
restart, reconciliation, and operator control with executable failure injection.
