/**
 * Returns the first value supplied for one long-form CLI option.
 *
 * Both `--name value` and `--name=value` are accepted. The parser is small on
 * purpose because repository scripts own only flat internal options; user-facing
 * CLI grammar belongs to the CLI layer selected by the product.
 */
export function stringArgument(
  name: string,
  fallback?: string,
): string | undefined {
  const prefix = `--${name}=`;
  for (let index = 0; index < Deno.args.length; index++) {
    const value = Deno.args[index];
    if (value === `--${name}`) return Deno.args[index + 1] ?? fallback;
    if (value.startsWith(prefix)) return value.slice(prefix.length);
  }
  return fallback;
}

/**
 * Returns every value supplied for one repeatable long-form CLI option.
 *
 * The original argument order is preserved because companion-skill and
 * reference selection can be meaningful before a caller deliberately sorts it.
 */
export function collectedArguments(name: string): string[] {
  const values: string[] = [];
  const prefix = `--${name}=`;
  for (let index = 0; index < Deno.args.length; index++) {
    const value = Deno.args[index];
    if (value === `--${name}` && Deno.args[index + 1] !== undefined) {
      values.push(Deno.args[++index]);
    } else if (value.startsWith(prefix)) {
      values.push(value.slice(prefix.length));
    }
  }
  return values;
}

/** Returns whether one exact long-form boolean flag is present. */
export function booleanArgument(name: string): boolean {
  return Deno.args.includes(`--${name}`);
}
