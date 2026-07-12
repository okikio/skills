/**
 * Replaces configured secret values before traces or reports are persisted.
 *
 * Empty values are ignored because replacing an empty string would corrupt the
 * entire document. Longer values run first so an overlapping short token cannot
 * reveal the remainder of a longer credential.
 */
export function redact(
  value: string,
  secrets: Readonly<Record<string, string | undefined>>,
): string {
  const entries = Object.entries(secrets)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .sort((left, right) => right[1].length - left[1].length);
  return entries.reduce(
    (output, [name, secret]) => output.replaceAll(secret, `[REDACTED:${name}]`),
    value,
  );
}
