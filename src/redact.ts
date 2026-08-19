/** Configured secret name and concrete non-empty value used for replacement. */
type SecretEntryType = readonly [name: string, value: string];

/**
 * Returns non-empty secret values from longest to shortest.
 *
 * Longest-first replacement prevents a shorter token that is a prefix of a
 * longer credential from exposing the unmatched remainder.
 */
function entries(
  secrets: Readonly<Record<string, string | undefined>>,
): SecretEntryType[] {
  return Object.entries(secrets)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .sort((left, right) => right[1].length - left[1].length);
}

/**
 * Replaces configured secret values in one plain string.
 *
 * Empty values are ignored because replacing an empty string would corrupt the
 * complete document. Use `redactValue()` before JSON serialization so secrets
 * containing quotes or backslashes are replaced in their original string form
 * instead of relying on their escaped JSON representation.
 */
export function redact(
  value: string,
  secrets: Readonly<Record<string, string | undefined>>,
): string {
  return entries(secrets).reduce(
    (output, [name, secret]) => output.replaceAll(secret, `[REDACTED:${name}]`),
    value,
  );
}

/**
 * Recursively redacts string values in JSON-like structured evidence.
 *
 * Arrays and ordinary objects are copied so callers can retain the original
 * provider telemetry in memory until evaluation finishes. Primitive non-string
 * values pass through unchanged. The evaluator uses this before persisting a
 * trace or sending target evidence to an external qualitative judge.
 */
export function redactValue(
  value: unknown,
  secrets: Readonly<Record<string, string | undefined>>,
): unknown {
  if (typeof value === "string") return redact(value, secrets);
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, secrets));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactValue(item, secrets),
      ]),
    );
  }
  return value;
}
