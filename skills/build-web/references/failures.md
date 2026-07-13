# Web failure signatures

| Signature | Likely cause | Next inspection |
|---|---|---|
| Interactive file exists but is never imported | Abandoned experiment | Route/component import graph |
| Static disclosure hydrates a framework | Native semantics overlooked | Required behavior and HTML primitive |
| Component renders unstyled | Generated CSS/token/registry contract missing | Registry, stylesheet layers, class definitions |
| Solid prop stops updating | Reactive prop destructured | Access paths, splitProps, memo/effect boundaries |
| Hydration mismatch or flash | Nondeterministic initial state | Server HTML and first client values |
| Removed item never disappears | Presence completion not called | Exit callback and retained owner |
| Work continues offscreen | Visibility policy only controlled hydration | Observer and frame ownership |
| Duplicate click after navigation | Repeated lifecycle listener | Idempotency and cleanup |
| Icon build/type failure | Wrong renderer compiler | Framework integration and import suffix |
| `client:only` build failure | Renderer cannot be inferred | Explicit renderer hint |
| Auth works but cross-org data leaks | Authentication mistaken for authorization | Server policy/base filter |
| Webhook logs keys or payloads | Boundary treated as page glue | Structured redaction and signature policy |
| Repository name implies an extension | Name trusted over source | Manifests, entrypoints, browser APIs |
| Motion types expose gestures but nothing responds | Declared API exceeds implementation | Event-binding source and tests |

Do not fix these by adding a broad framework abstraction. Identify the actual
owner, preserve renderer semantics, and verify the corrected path.
