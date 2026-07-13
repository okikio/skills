import assert from "node:assert/strict";
import { evaluateAssertion } from "../src/assert.ts";
import { redact } from "../src/redact.ts";

const assertEquals: (actual: unknown, expected: unknown) => void =
  assert.deepEqual;
async function assertRejects(
  operation: () => Promise<unknown>,
  errorClass: { [Symbol.hasInstance](value: unknown): boolean },
  message: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    assert.ok(error instanceof errorClass);
    assert.match(String(error), new RegExp(message));
    return;
  }
  assert.fail("Expected operation to reject");
}

Deno.test("redaction removes overlapping secrets without recording values", () => {
  assertEquals(
    redact("token-long token", { SHORT: "token", LONG: "token-long" }),
    "[REDACTED:LONG] [REDACTED:SHORT]",
  );
});

Deno.test("text assertions distinguish required and forbidden output", async () => {
  const root = await Deno.makeTempDir();
  try {
    assertEquals(
      (await evaluateAssertion(
        { kind: "contains", value: "verified", caseSensitive: false },
        "VERIFIED",
        root,
      )).passed,
      true,
    );
    assertEquals(
      (await evaluateAssertion(
        { kind: "not-contains", value: "published", caseSensitive: false },
        "validated locally",
        root,
      )).passed,
      true,
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("file assertions cannot escape the fixture", async () => {
  const root = await Deno.makeTempDir();
  try {
    await assertRejects(
      () =>
        evaluateAssertion(
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

Deno.test("file-change assertions compare against an isolated baseline", async () => {
  const baseline = await Deno.makeTempDir();
  const candidate = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${baseline}/doc.md`, "original\n");
    await Deno.writeTextFile(`${candidate}/doc.md`, "changed\n");
    assertEquals(
      (await evaluateAssertion(
        { kind: "file-changed", value: "doc.md" },
        "",
        candidate,
        baseline,
      )).passed,
      true,
    );
    assertEquals(
      (await evaluateAssertion(
        { kind: "file-unchanged", value: "doc.md" },
        "",
        candidate,
        baseline,
      )).passed,
      false,
    );
  } finally {
    await Deno.remove(baseline, { recursive: true });
    await Deno.remove(candidate, { recursive: true });
  }
});
