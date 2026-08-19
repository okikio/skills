import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { prepareFixture } from "../src/fixture.ts";

/** Assert that an async operation rejects with an expected class and message. */
async function expectRejects(
  operation: () => Promise<unknown>,
  errorClass: { [Symbol.hasInstance](value: unknown): boolean },
  message?: string,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    expect(error instanceof errorClass).toBe(true);
    if (message) expect(String(error)).toMatch(new RegExp(message));
    return;
  }
  throw new Error("Expected operation to reject");
}

describe("fixture isolation", () => {
  it("keeps fixture runs isolated from one another", async () => {
    const first = await prepareFixture("workspace");
    const second = await prepareFixture("workspace");
    try {
      await Deno.writeTextFile(new URL("marker", `file://${first}/`), "changed");
      await expectRejects(
        () => Deno.stat(new URL("marker", `file://${second}/`)),
        Deno.errors.NotFound,
      );
    } finally {
      await Deno.remove(first, { recursive: true });
      await Deno.remove(second, { recursive: true });
    }
  });

  it("rejects fixture names that escape the fixture root", async () => {
    await expectRejects(() => prepareFixture("../outside"), Error, "escapes");
  });
});
