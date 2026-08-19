import { isAbsolute, normalize, relative, resolve } from "node:path";
import * as command from "./command.ts";
import type { AssertionType } from "./corpus.ts";
import type { AssertionResultType } from "./evaluation.ts";

/** Maximum diagnostics retained from one assertion command stream. */
const MAX_COMMAND_OUTPUT_BYTES = 64 * 1024;
/** Maximum command diagnostics persisted as assertion evidence. */
const MAX_EVIDENCE_CHARACTERS = 2_000;

/** Environment names deterministic fixture verifiers are allowed to inherit. */
const COMMAND_ENV_NAMES = [
  "PATH",
  "HOME",
  "TMPDIR",
  "TEMP",
  "TMP",
  "SYSTEMROOT",
  "WINDIR",
  "COMSPEC",
  "DENO_DIR",
] as const;

/** Build a minimal verifier environment without forwarding unrelated secrets. */
function getCommandEnvironment(): Record<string, string> {
  const environment: Record<string, string> = {};
  for (const name of COMMAND_ENV_NAMES) {
    const value = Deno.env.get(name);
    if (value !== undefined) environment[name] = value;
  }
  return environment;
}

/**
 * Resolves an assertion path inside its isolated fixture tree.
 *
 * Absolute input and normalized traversal outside `root` are rejected before a
 * filesystem operation can observe data belonging to the repository or host.
 */
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

/** Returns whether one fixture path exists without hiding non-not-found errors. */
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
 * File assertions stay inside the isolated fixture. Command assertions receive
 * only a small runtime/path environment allowlist rather than arbitrary parent
 * credentials. Their retained output and wall-clock lifetime are bounded by
 * repository policy.
 */
export async function evaluateAssertion(
  assertion: AssertionType,
  output: string,
  fixtureRoot: string,
  baselineRoot?: string,
): Promise<AssertionResultType> {
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
    assertion.kind === "file-unchanged" ||
    assertion.kind === "file-changed"
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

  const [executable, ...args] = assertion.command;
  if (!executable) throw new Error("Command assertion requires an executable");
  const result = await command.call(executable, args, {
    cwd: fixtureRoot,
    clearEnv: true,
    env: getCommandEnvironment(),
    timeoutMs: assertion.timeoutMs,
    outputBytes: MAX_COMMAND_OUTPUT_BYTES,
  });
  const stdoutMatches = assertion.stdout === undefined ||
    new RegExp(assertion.stdout, "m").test(result.stdout);
  const stderrMatches = assertion.stderr === undefined ||
    new RegExp(assertion.stderr, "m").test(result.stderr);
  const truncated = result.stdoutTruncated || result.stderrTruncated;
  const diagnostics = `${result.stdout}\n${result.stderr}`;
  const evidence = `${diagnostics.slice(0, MAX_EVIDENCE_CHARACTERS)}${
    truncated ? "\n[diagnostics truncated]" : ""
  }`;

  return {
    label: `command:${assertion.command.join(" ")}`,
    passed: !result.timedOut && !truncated &&
      result.code === assertion.expectedExitCode &&
      stdoutMatches && stderrMatches,
    evidence,
  };
}
