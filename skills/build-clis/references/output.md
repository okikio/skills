# Results, diagnostics, and durable artifacts

## Three channels

1. Stable command results are user-requested output. They go to stdout or an
   explicitly selected destination in a documented format.
2. Operational diagnostics describe execution. They go to stderr or selected
   diagnostic sinks.
3. Durable artifacts are application state or exports. They belong to typed
   file, database, checkpoint, or object-store writers.

Routing all observable process output through LogTape does not mean databases,
JSONL stages, and checkpoints should be logger calls.

## LogTape routing

Preserve the repository's existing output owner unless the task selects or
migrates transport. Apply the following routing contract when LogTape is the
verified owner.

Use category ownership. A result category should have a dedicated raw sink and
must not inherit diagnostic sinks. In LogTape configurations that support it,
`parentSinks: "override"` is the critical isolation rule.

Operational categories should carry structured properties and causal context.
Use pretty, plain, or JSON/JSONL formatters only on diagnostic sinks. The result
sink must not add timestamps, levels, category prefixes, or color to stable
stdout.

Inspect the applicable LogTape ecosystem: core, pretty, file, redaction,
testing, lint maturity, framework adapters, and `@optique/logtape`. Exclude
packages that duplicate existing configuration ownership or do not support the
project's dialect/runtime.

## Redaction order

Redact structured data before serialization. If a complete object is converted
to one `result` string first, field-based redaction can no longer see nested
passwords, authorization values, cookies, API keys, or tokens.

Then render, add the exact newline policy, and transport raw bytes through the
result sink. Test nested values, arrays, causes, and metadata.

## Output modes

Define human, plain, JSON, and JSONL contracts separately where they exist.
Machine modes require stable schemas, no decoration, and documented empty/null
behavior. `--quiet` usually reduces diagnostics; `--silent` may suppress them
entirely. Neither should silently discard an explicitly requested result unless
the CLI contract says so.

## Lifecycle

Configure logging once at the composition root, including bootstrap failures.
Flush and reset sinks on successful and failed termination. Test exact stdout,
stderr diagnostic count, selected files, and absence of duplicate result records.
