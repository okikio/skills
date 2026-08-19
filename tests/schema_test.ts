import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { EvalCaseFileSchema, EvalCaseSchema } from "../src/corpus.ts";

describe("evaluation corpus schema", () => {
  it("keeps core cases unique across every split family", async () => {
    const source = JSON.parse(
      await Deno.readTextFile(
        new URL("../evals/cases/core.json", import.meta.url),
      ),
    );
    const parsed = EvalCaseFileSchema.parse(source);
    expect(parsed.cases).toHaveLength(100);
    expect(new Set(parsed.cases.map((item) => item.id)).size).toBe(100);
    expect(new Set(parsed.cases.map((item) => item.split))).toEqual(
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

  it("keeps composition cases explicitly composed", async () => {
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
    expect(composition.length).toBeGreaterThanOrEqual(20);
    expect(composition.every((item) => item.expectedSkills.length > 0)).toBe(
      true,
    );
  });

  it("rejects unknown fields in repository-owned case contracts", () => {
    const parsed = EvalCaseSchema.safeParse({
      id: "strict-case",
      title: "Strict case",
      skill: "build-clis",
      kind: "routing",
      split: "train",
      prompt: "Route this request through the intended skill.",
      assertions: [{ kind: "contains", value: "route" }],
      tags: ["strict"],
      rationale: "First-party serialized contracts reject accidental fields.",
      accidental: true,
    });
    expect(parsed.success).toBe(false);
  });

});
