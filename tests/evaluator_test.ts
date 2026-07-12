import { assertEquals, assertRejects } from "@std/assert";
import { evaluateAssertion } from "../src/assert.ts";
import { redact } from "../src/redact.ts";

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
