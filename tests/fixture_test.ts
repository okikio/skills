import assert from "node:assert/strict";
import { prepareFixture } from "../src/fixture.ts";

async function assertRejects(
  operation: () => Promise<unknown>,
  errorClass: { [Symbol.hasInstance](value: unknown): boolean },
  message?: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    assert.ok(error instanceof errorClass);
    if (message) assert.match(String(error), new RegExp(message));
    return;
  }
  assert.fail("Expected operation to reject");
}

Deno.test("fixture runs are isolated from one another", async () => {
  const first = await prepareFixture("workspace");
  const second = await prepareFixture("workspace");
  try {
    await Deno.writeTextFile(new URL("marker", `file://${first}/`), "changed");
    await assertRejects(
      () => Deno.stat(new URL("marker", `file://${second}/`)),
      Deno.errors.NotFound,
    );
  } finally {
    await Deno.remove(first, { recursive: true });
    await Deno.remove(second, { recursive: true });
  }
});

Deno.test("fixture names cannot escape the fixture root", async () => {
  await assertRejects(() => prepareFixture("../outside"), Error, "escapes");
});
