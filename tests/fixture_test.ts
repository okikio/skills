import { assertEquals, assertRejects } from "@std/assert";
import { prepareFixture } from "../src/fixture.ts";

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
