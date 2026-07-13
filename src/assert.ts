import { isAbsolute, normalize, relative, resolve } from "node:path";
import { z } from "zod";
import type { Assertion } from "./eval_schema.ts";

export const AssertionResultSchema = z.object({
  label: z.string(),
  passed: z.boolean(),
  evidence: z.string().optional(),
});
export type AssertionResult = z.infer<typeof AssertionResultSchema>;

function fixturePath(root: string, value: string): string {
  if (isAbsolute(value)) {
    throw new Error("Fixture assertions require relative paths");
  }
  const target = resolve(root, normalize(value));
  const relation = relative(resolve(root), target);
  if (relation.startsWith("..") || isAbsolute(relation)) {
    throw new Error("Fixture assertion escapes its isolated root");
  }
  return target;
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

/**
 * Evaluates deterministic assertions before any qualitative model judge.
 *
 * Commands run inside the isolated fixture with no additional permissions
 * granted by this module. The parent evaluation process controls the sandbox
 * and timeout policy.
 */
export async function evaluateAssertion(
  assertion: Assertion,
  output: string,
  fixtureRoot: string,
  baselineRoot?: string,
): Promise<AssertionResult> {
  if (assertion.kind === "contains" || assertion.kind === "not-contains") {
    const source = assertion.caseSensitive ? output : output.toLowerCase();
    const expected = assertion.caseSensitive
      ? assertion.value
      : assertion.value.toLowerCase();
    const contains = source.includes(expected);
    return {
      label: `${assertion.kind}:${assertion.value}`,
      passed: assertion.kind === "contains" ? contains : !contains,
    };
  }
  if (assertion.kind === "regex") {
    const passed = new RegExp(assertion.value, assertion.flags).test(output);
    return { label: `regex:${assertion.value}`, passed };
  }
  if (
    assertion.kind === "file-exists" ||
    assertion.kind === "file-not-exists"
  ) {
    const present = await exists(fixturePath(fixtureRoot, assertion.value));
    return {
      label: `${assertion.kind}:${assertion.value}`,
      passed: assertion.kind === "file-exists" ? present : !present,
    };
  }
  if (
    assertion.kind === "file-unchanged" || assertion.kind === "file-changed"
  ) {
    if (!baselineRoot) {
      throw new Error(`${assertion.kind} requires a baseline fixture root`);
    }
    const current = fixturePath(fixtureRoot, assertion.value);
    const baseline = fixturePath(baselineRoot, assertion.value);
    const currentPresent = await exists(current);
    const baselinePresent = await exists(baseline);
    const same = currentPresent === baselinePresent && (!currentPresent ||
      await Deno.readTextFile(current) === await Deno.readTextFile(baseline));
    return {
      label: `${assertion.kind}:${assertion.value}`,
      passed: assertion.kind === "file-unchanged" ? same : !same,
    };
  }
  const [command, ...args] = assertion.command;
  if (!command) throw new Error("Command assertion requires an executable");
  const child = new Deno.Command(command, {
    args,
    cwd: fixtureRoot,
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      child.kill("SIGTERM");
    } catch {
      // The process may finish between the timeout and signal delivery.
    }
  }, assertion.timeoutMs);
  const result = await child.output();
  clearTimeout(timer);
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  const stdoutMatches = assertion.stdout === undefined ||
    new RegExp(assertion.stdout, "m").test(stdout);
  const stderrMatches = assertion.stderr === undefined ||
    new RegExp(assertion.stderr, "m").test(stderr);
  const evidence = `${stdout}\n${stderr}`.slice(0, 2_000);
  return {
    label: `command:${assertion.command.join(" ")}`,
    passed: !timedOut && result.code === assertion.expectedExitCode &&
      stdoutMatches && stderrMatches,
    evidence,
  };
}
