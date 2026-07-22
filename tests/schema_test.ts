import assert from "node:assert/strict";
import { EvalCaseFileSchema } from "../src/eval_schema.ts";

const assertEquals: (actual: unknown, expected: unknown) => void =
  assert.deepEqual;

Deno.test("the core evaluation corpus has unique cases across all split families", async () => {
  const source = JSON.parse(
    await Deno.readTextFile(
      new URL("../evals/cases/core.json", import.meta.url),
    ),
  );
  const parsed = EvalCaseFileSchema.parse(source);
  assertEquals(parsed.cases.length, 100);
  assertEquals(new Set(parsed.cases.map((item) => item.id)).size, 100);
  assertEquals(
    new Set(parsed.cases.map((item) => item.split)),
    new Set([
      "train",
      "valid-seen",
      "valid-unseen",
      "transfer",
      "adversarial",
      "test-frozen",
    ]),
  );
});

Deno.test("composition cases cover composed behavior", async () => {
  const source = EvalCaseFileSchema.parse(
    JSON.parse(
      await Deno.readTextFile(
        new URL("../evals/cases/core.json", import.meta.url),
      ),
    ),
  );
  const composition = source.cases.filter((item) =>
    item.skill === "composition"
  );
  assertEquals(composition.length >= 20, true);
  assertEquals(
    composition.every((item) => item.expectedSkills.length > 0),
    true,
  );
});
