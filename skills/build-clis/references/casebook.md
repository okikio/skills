# Kaiju CLI casebook

These cases are evidence patterns, not claims that the source repository is a
finished reference implementation.

## Patterns to preserve

- Static command registration keeps compiled and bundled commands visible.
- Shared parser groups plus final source schemas can separate token grammar from
  domain validation, provided lost refinements are reapplied deliberately.
- Sparse CLI, environment, and file patches can merge before runtime defaults.
- Declarative array replace/append/prepend operations can compose from low to
  high precedence while keeping inputs immutable.
- A LogTape result category with parent-sink override can preserve exact stdout.
- A typed `StageWriter` can own validated durable JSONL while optionally emitting
  diagnostics through LogTape.

## Failures to detect

| Observed signature | Contract defect |
|---|---|
| README tasks point to missing files or permission sets | Docs/task/executable parity failure |
| README flags differ from parser values | Public-language drift |
| Root and package manifests use different c12/Optique/LogTape versions | Ownership and version boundary unresolved |
| Config resolves before parse and again inside handlers | Dynamic factories may execute twice; provenance and precedence can drift |
| `config explain` prints only static precedence | It does not explain field winners or shadowed values |
| `.env` participates through one parser path but not the public resolver | Split source ownership |
| One `--from`/`--to` pair becomes both crawl IDs and capture timestamps | One public name has two domain meanings |
| Positive and negative flags are independent options | Parser can accept a structurally invalid state |
| Result object serializes before field redaction | Nested secrets remain visible inside one string |
| Handler logs and rethrows; entrypoint logs again | Duplicate public diagnostics |
| Every failure exits 2 | Automation cannot distinguish usage, unavailable, conflict, cancellation, and internal defects |
| Active runner creates an unattached signal | Cancellation types exist without process ownership |
| Guidebook describes paging, telemetry, resume, or output modes | Normative aspiration, not executable proof |

## Review procedure

For a request against this codebase, first identify the exact installed revision,
then trace the active entrypoint. Do not treat unused helpers, README claims, or
guidebook policies as live behavior. Convert each accepted correction into a
subprocess or generated-surface oracle so the discrepancy cannot silently return.
