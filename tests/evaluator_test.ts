import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { evaluateAssertion } from "../src/assert.ts";
import { redact, redactValue } from "../src/redact.ts";

/**
 * Assert that an async operation rejects with the expected error class and
 * message fragment.
 */
async function expectRejects(
  operation: () => Promise<unknown>,
  errorClass: { [Symbol.hasInstance](value: unknown): boolean },
  message: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    expect(error instanceof errorClass).toBe(true);
    expect(String(error)).toMatch(new RegExp(message));
    return;
  }
  throw new Error("Expected operation to reject");
}

describe("evaluation assertions", () => {
  it("redacts overlapping secrets without recording values", () => {
    expect(redact("token-long token", { SHORT: "token", LONG: "token-long" }))
      .toBe("[REDACTED:LONG] [REDACTED:SHORT]");
  });

  it("redacts structured strings before JSON escaping", () => {
    const secret = 'quoted"\\token';
    const value = redactValue(
      { nested: [secret, { text: `prefix ${secret} suffix` }] },
      { API_KEY: secret },
    );
    const serialized = JSON.stringify(value);

    expect(serialized).not.toContain("quoted");
    expect(serialized).toContain("[REDACTED:API_KEY]");
  });

  it("distinguishes required and forbidden output", async () => {
    const root = await Deno.makeTempDir();
    try {
      expect((await evaluateAssertion(
        { kind: "contains", value: "verified", caseSensitive: false },
        "VERIFIED",
        root,
      )).passed).toBe(true);
      expect((await evaluateAssertion(
        { kind: "not-contains", value: "published", caseSensitive: false },
        "validated locally",
        root,
      )).passed).toBe(true);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it("prevents file assertions from escaping the fixture", async () => {
    const root = await Deno.makeTempDir();
    try {
      await expectRejects(
        () => evaluateAssertion(
          { kind: "file-exists", value: "../outside" },
          "",
          root,
        ),
        Error,
        "escapes",
      );
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it("does not forward unrelated parent environment values to command assertions", async () => {
    const root = await Deno.makeTempDir();
    const name = "SKILLOPT_TEST_SECRET";
    const previous = Deno.env.get(name);
    Deno.env.set(name, "must-not-leak");
    try {
      const result = await evaluateAssertion({
        kind: "command",
        command: [
          Deno.execPath(),
          "eval",
          `console.log(Deno.env.get("${name}") ?? "missing")`,
        ],
        expectedExitCode: 0,
        stdout: "^missing$",
        timeoutMs: 2_000,
      }, "", root);

      expect(result.passed).toBe(true);
      expect(result.evidence).not.toContain("must-not-leak");
    } finally {
      if (previous === undefined) Deno.env.delete(name);
      else Deno.env.set(name, previous);
      await Deno.remove(root, { recursive: true });
    }
  });

  it("compares file changes against an isolated baseline", async () => {
    const baseline = await Deno.makeTempDir();
    const candidate = await Deno.makeTempDir();
    try {
      await Deno.writeTextFile(`${baseline}/doc.md`, "original\n");
      await Deno.writeTextFile(`${candidate}/doc.md`, "changed\n");
      expect((await evaluateAssertion(
        { kind: "file-changed", value: "doc.md" },
        "",
        candidate,
        baseline,
      )).passed).toBe(true);
      expect((await evaluateAssertion(
        { kind: "file-unchanged", value: "doc.md" },
        "",
        candidate,
        baseline,
      )).passed).toBe(false);
    } finally {
      await Deno.remove(baseline, { recursive: true });
      await Deno.remove(candidate, { recursive: true });
    }
  });
});
