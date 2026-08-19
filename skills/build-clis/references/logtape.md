# LogTape output and diagnostics manual

## Contents

- [Evidence and ownership](#evidence-and-ownership)
- [Package capability map](#package-capability-map)
- [Category architecture](#category-architecture)
- [Stable result isolation](#stable-result-isolation)
- [Diagnostic routing](#diagnostic-routing)
- [Structured events and context](#structured-events-and-context)
- [Filters, levels, and output policy](#filters-levels-and-output-policy)
- [Redaction before rendering](#redaction-before-rendering)
- [Bootstrap and reconfiguration](#bootstrap-and-reconfiguration)
- [Lifecycle and disposal](#lifecycle-and-disposal)
- [Library and application boundaries](#library-and-application-boundaries)
- [Testing](#testing)
- [Exclusions](#exclusions)
- [Failure signatures](#failure-signatures)
- [Sources and freshness](#sources-and-freshness)

## Evidence and ownership

Treat the productionized CLI guidebook as the normative architecture. Treat the
attached Kaiju diagnostics package as an observed LogTape 2.2.4 implementation,
not a complete or universally correct reference.

Before adopting this design, establish the existing output owner. If the
repository does not use LogTape and the request does not authorize a migration,
preserve its verified transport and apply only compatible channel principles.

If LogTape is the owner, route every observable process result and diagnostic
through it. Do not retain `console.log` for results or add a second reporter for
friendly progress. Durable application artifacts remain outside the log graph.

## Package capability map

| Capability | Package | Use |
|---|---|---|
| Categories, records, filters, formatters, sinks, context | `@logtape/logtape` | Required transport core |
| Human terminal diagnostics | `@logtape/pretty` | Pretty formatter after stream/color policy |
| File and rotating diagnostics | `@logtape/file` | Durable support logs and configured files |
| Structured secret protection | `@logtape/redaction` | Wrap every result and diagnostic route before formatting |
| Recorder-backed assertions | `@logtape/testing` | Categories, levels, messages, context, and properties |
| Parser-owned verbosity and destinations | `@optique/logtape` | CLI terms only; does not configure the graph |
| Static rules | `@logtape/lint` | Adopt only when runtime/linter integration maturity fits |
| OpenTelemetry | `@logtape/otel` | Explicitly selected remote telemetry route |
| Other remote/system sinks | Sentry, syslog, CloudWatch, Windows Event Log integrations | Deployment-specific and consent/policy gated |

Inspect the installed version and package exports. Do not add:

- `@logtape/config` when c12 and the application schema already own config;
- a database adapter that does not support the actual dialect or custom adapter;
- every remote sink merely because the ecosystem provides one;
- LogTape packages to manifests that do not import them directly.

## Category architecture

Model categories as ownership and routing namespaces:

```text
app.result              stable general result
app.clickhouse.result   stable ClickHouse-specific result, if separately owned
app.cli                 command lifecycle diagnostics
app.config              config discovery and resolution
app.http                request/retry diagnostics
app.workflow            durable-work client diagnostics
app.deprecation         compatibility warnings
app.progress            structured progress events
logtape.meta            transport configuration failures
```

Use category hierarchy to share policy. Do not encode the entire event type in a
free-form message string. Bind stable dimensions such as command, run ID, target,
and request ID as context or structured properties.

Define category constants so result routing cannot drift:

```ts
export const APP_CATEGORY = ["app"] as const;
export const RESULT_CATEGORY = [...APP_CATEGORY, "result"] as const;
```

## Stable result isolation

A stable result is user-requested output. It may be JSON, JSONL, a completion
script, a man page, a generated config, or plain text. It must remain pipe-safe.

Configure a dedicated raw sink and block inherited diagnostic sinks:

```ts
await configure({
	sinks: {
		result: redactByField(createResultSink(), redactionOptions),
		diagnostic: redactByField(createDiagnosticSink(options), redactionOptions),
	},
	loggers: [
		{
			category: [...RESULT_CATEGORY],
			lowestLevel: "info",
			sinks: ["result"],
			parentSinks: "override",
		},
		{
			category: [...APP_CATEGORY],
			lowestLevel: options.level,
			sinks: ["diagnostic"],
		},
	],
});
```

`parentSinks: "override"` is the important isolation contract in the observed
LogTape version. Verify the option name and behavior in the installed version.

Carry the raw rendered text as a structured property:

```ts
export function emitResult(text: string): void {
	getLogger([...RESULT_CATEGORY]).info("{result}", {
		result: text.endsWith("\n") ? text : `${text}\n`,
	});
}
```

The raw sink reads only the expected property:

```ts
function createResultSink(): Sink {
	const encoder = new TextEncoder();
	return (record): void => {
		const result = record.properties.result;
		if (typeof result !== "string") {
			throw new TypeError("Result records require a string result property.");
		}
		Deno.stdout.writeSync(encoder.encode(result));
	};
}
```

Do not let the result sink add timestamps, levels, category names, colors, or a
second newline. Define exact newline and empty-result policy. For JSONL, emit one
complete JSON value per record and reject embedded raw newlines where the schema
forbids them.

## Diagnostic routing

Diagnostics describe execution rather than return the requested value. Route
them to stderr, a selected file, or explicitly configured remote sinks.

Select formatters by mode:

```ts
function diagnosticFormatter(options: LogOptions): TextFormatter {
	if (options.format === "json") return jsonLinesFormatter;
	if (options.format === "plain") return defaultTextFormatter;
	return getPrettyFormatter({
		timestamp: "time",
		colors: options.colors,
		properties: true,
		wordWrap: options.width,
	});
}
```

Resolve terminal width and color for stderr independently from stdout. Never put
ANSI styling in machine results. `NO_COLOR`, forced color, explicit flags, CI,
TTY status, and stream capability need one precedence policy.

Use a file sink when diagnostics must survive the process or support a bug
bundle. Define rotation, retention, permissions, path ownership, flushing, and
failure policy. A failed optional diagnostic file should not silently destroy a
successful domain result; the product must decide whether it degrades, warns, or
fails before starting work.

## Structured events and context

Keep message templates stable and properties queryable:

```ts
logger.info("migration generated", {
	migration_id: migration.id,
	statement_count: migration.statements.length,
	output_path: migration.path,
});
```

Avoid pre-rendered interpolation when the values matter:

```ts
logger.info(`Generated ${migration.id} with ${migration.statements.length}`);
```

The structured form preserves filtering, JSON encoding, redaction, recorder
tests, support-bundle extraction, and future telemetry.

Bind stable context once per operation:

```text
run_id
command
target
request_id
plan_id
attempt
```

Use lazy properties for expensive debug-only calculations. Do not hash files,
serialize large graphs, or inspect the filesystem before knowing a sink will
receive the debug record.

Log a cause as structured, redacted data. Public error rendering remains owned
by the executable boundary. Do not emit the same failure in a handler and again
at the entrypoint.

## Filters, levels, and output policy

Keep result mode separate from diagnostic verbosity:

```ts
const OutputPolicySchema = z.object({
	mode: z.enum(["human", "plain", "json", "jsonl"]),
	quiet: z.boolean().default(false),
	silent: z.boolean().default(false),
	color: z.enum(["auto", "always", "never"]).default("auto"),
});
```

Suggested semantics:

- `--quiet` suppresses routine human diagnostics while preserving warnings,
  errors, and requested results;
- `--silent` suppresses diagnostics but preserves requested results unless the
  public contract explicitly says otherwise;
- repeated `-v` raises diagnostic detail but does not change result encoding;
- a configured level and repeated verbosity need an explicit algebra;
- subsystem filters may raise or lower a category without changing siblings.

The observed Kaiju adapter treats repeated verbosity as an override only when it
raises detail above its baseline. That is one product policy, not a LogTape rule.
Document and test the chosen behavior.

Progress is a structured event stream. A TTY renderer may turn it into a spinner
or live region; a JSON diagnostic sink may retain state changes; normal stderr
may show only acknowledgement and milestones. Do not add Clack or Consola as an
untracked second event transport.

## Redaction before rendering

Wrap every sink before any formatter serializes the record:

```ts
const sink = redactByField(createDiagnosticSink(options), {
	fieldPatterns: [
		...DEFAULT_REDACT_FIELDS,
		/^authorization$/iu,
		/^cookie$/iu,
		/^set-cookie$/iu,
	],
	action: () => "[REDACTED]",
});
```

Redaction after `JSON.stringify()` cannot see nested field names. Never convert
a config, headers object, result, or error cause into one opaque string before
redaction.

Cover more than field names:

- passwords, API keys, authorization, cookies, and tokens;
- secrets embedded in URLs and connection strings;
- arrays and nested records;
- errors and causes;
- argument/config snapshots;
- result output such as `config show`;
- bootstrap failures;
- support bundles and remote routes.

Use value-pattern redaction or keyed pseudonymization when field names are
insufficient. Pseudonyms must use protected key material and must not make the
original recoverable.

Redaction is defense in depth. Continue to reject secrets in argv and general
diagnostic environment dumps.

## Bootstrap and reconfiguration

Configuration can fail before the full CLI is parsed. Implement a deliberately
small early-control pass:

```text
raw args and environment
  -> logging-only controls
  -> bootstrap LogTape configuration
  -> c12/source loading
  -> full Optique parse
  -> validated final logging policy
  -> reconfigure once
  -> command execution
```

The early pass may recover log format, destination, level, and silent policy. It
must not duplicate domain grammar. Test malformed configuration with each early
logging option and verify stdout remains empty.

If reconfiguration calls `reset()`, ensure no active command logs between reset
and final configuration. Cache an exact normalized signature only if repeated
configuration is semantically idempotent. Tests must reset process-global state
between cases.

## Lifecycle and disposal

Configure LogTape at the composition root. Before exit:

1. stop new work;
2. abort or complete active operations;
3. close owned domain resources;
4. flush asynchronous sinks;
5. dispose file and remote transport resources;
6. reset process-global logging state for embedded/test contexts;
7. return the stable exit status.

Do not close the host's stdout or stderr stream. The adapter owns wrappers, not
process-global streams.

Exercise success, domain failure, parse failure, config failure, cancellation,
and second-interrupt paths. A direct `Deno.exit()` or `process.exit()` before
awaited cleanup can lose file or remote records.

## Library and application boundaries

Expose a small structural logger contract to reusable packages:

```ts
export interface DiagnosticLogger {
	debug(message: string, properties?: Readonly<Record<string, unknown>>): void;
	info(message: string, properties?: Readonly<Record<string, unknown>>): void;
	warn(message: string, properties?: Readonly<Record<string, unknown>>): void;
	error(message: string, properties?: Readonly<Record<string, unknown>>): void;
}
```

Libraries record events but never choose sinks, files, remote endpoints, global
levels, or redaction policy. Without application configuration, library logging
must remain safe and silent according to LogTape's library-first model.

Keep durable JSONL stage writers, databases, checkpoints, and exports as their
own typed capabilities. They may also emit diagnostic records, but LogTape must
not become their persistence protocol.

## Testing

Use `@logtape/testing` recorder sinks for structured assertions and subprocess
tests for byte-level process contracts.

Test:

- category, level, message template, properties, and bound context;
- result category does not reach parent diagnostic sinks;
- diagnostic category never reaches stdout;
- exact result bytes and newline behavior;
- pretty/plain/JSON diagnostic shape;
- quiet, silent, repeated verbosity, and subsystem levels;
- nested redaction in results and every diagnostic sink;
- bootstrap config failure routing;
- selected file destination and file flush;
- one public failure record, not duplicates;
- process cancellation and sink cleanup;
- reset isolation between tests;
- remote sink absence until consent/policy is present.

Example route assertions:

```text
command success with --json
  stdout: exactly one JSON document
  stderr: empty at normal level
  file: no result record

invalid config with --log-format json --log-output errors.jsonl
  stdout: empty
  stderr: empty when file exclusively owns diagnostics
  file: one redacted JSONL failure record
  exit: configuration class
```

## Exclusions

- Do not add Consola beside LogTape for friendly output. It is an alternative
  terminal logger/reporter and would split routing and testing ownership.
- Do not send pager control sequences through a sink. A pager consumes a
  completed human result document after result rendering policy selects it.
- Do not use remote telemetry without consent or explicit organization policy.
- Do not let telemetry failure block the command unless the product explicitly
  requires audit delivery.
- Do not put `console.*` fallbacks inside handlers. If bootstrap transport can
  fail, define one minimal emergency boundary at the executable root.
- Do not treat LogTape as a workflow history, queue, database, or artifact store.

## Failure signatures

| Signature | Likely cause | Next inspection |
|---|---|---|
| JSON contains timestamps/category prefixes | Result inherited diagnostic formatter | Check result category and `parentSinks` |
| Result appears twice | Result reaches result and parent sinks | Check category hierarchy and override |
| Secret survives inside a JSON string | Serialization happened before redaction | Keep object structured until sink wrapper |
| `--silent` removes requested JSON | Result and diagnostics share one filter | Separate result category from level policy |
| Invalid config ignores `--log-output` | Logger configured only after config resolution | Add logging-only bootstrap pass |
| Same error appears twice | Handler and boundary both render/log | Give public error output one owner |
| File log misses final records | Process exits before flush/disposal | Trace awaited lifecycle boundary |
| Test records leak between cases | Process-global LogTape state not reset | Reset in test teardown |
| Debug logging is expensive when hidden | Properties computed eagerly | Use lazy evaluation and category filters |
| Pretty output corrupts a pipe | TTY/color resolved globally, not per stream | Inspect stdout/stderr policy separately |
| Durable stage data appears as log messages | Artifact persistence was collapsed into diagnostics | Restore typed writer/store ownership |
| Remote data leaves process unexpectedly | Sink enabled without consent/policy | Trace telemetry configuration and defaults |

## Sources and freshness

- Normative source: `productionized-cli-pattern-guidebook-v1.1(1).md`, reviewed 2026-07-17.
- Normative ecosystem audit: `cli-guidelines-audit-and-expansion(1).md`, reviewed 2026-07-17.
- Observed implementation: `live-browser-cli(41).zip/packages/diagnostics/src/logging.ts` and its tests/manifests, reviewed 2026-07-17.
- Official documentation: <https://logtape.org/>, discovery pointer for current categories, sinks, formatters, filters, redaction, and integrations.
- Official source: <https://github.com/dahlia/logtape>, discovery pointer for package/version history.

Freshness status: the concrete configuration example is grounded in LogTape
2.2.4 from the attached lockfile. Verify `parentSinks`, sink wrapper signatures,
formatter APIs, lint maturity, and optional package names against the installed
version before copying code.
