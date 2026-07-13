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

export function booleanArgument(name: string): boolean {
  return Deno.args.includes(`--${name}`);
}
