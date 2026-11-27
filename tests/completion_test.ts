import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapabilityRegistrySchema,
  EvalCaseFileSchema,
  type EvalCaseType,
  SourceRegistrySchema,
} from "../src/corpus.ts";
import { walkFiles } from "../src/files.ts";
import { operationalSources } from "../src/guidance.ts";
import { referenceSource } from "../src/paths.ts";

/** Repository root used to compare skill references with the evaluation ledger. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Load every evaluation case so capability records can prove split coverage. */
async function getCases(): Promise<EvalCaseType[]> {
  const cases: EvalCaseType[] = [];
  for await (const path of walkFiles(join(root, "evals", "cases"))) {
    if (!path.endsWith(".json")) continue;
    const file = EvalCaseFileSchema.parse(
      JSON.parse(await Deno.readTextFile(path)),
    );
    cases.push(...file.cases);
  }
  return cases;
}

describe("skill completion contract", () => {
  it("maps every operational source to a sourced capability", async () => {
    const capabilities = CapabilityRegistrySchema.parse(
      JSON.parse(
        await Deno.readTextFile(join(root, "evals", "capabilities.json")),
      ),
    );
    const sources = SourceRegistrySchema.parse(
      JSON.parse(
        await Deno.readTextFile(join(root, "evals", "sources.json")),
      ),
    );
    const knownSources = new Map(
      sources.sources.map((source) => [source.id, new Set(source.claimPaths)]),
    );
    const mapped = new Set(
      capabilities.capabilities.map((capability) =>
        referenceSource(`${capability.skill}/${capability.reference}`)
      ),
    );

    expect(await operationalSources(root)).toEqual([...mapped].sort());
    expect(
      capabilities.capabilities.every((capability) =>
        capability.sourceIds.every((source) => {
          const [base, ...fragment] = source.split(":");
          return knownSources.has(base) && (fragment.length === 0 ||
            knownSources.get(base)!.has(fragment.join(":")));
        })
      ),
    ).toBe(true);
  });

  it("gives every capability train, seen, and held-out evidence", async () => {
    const capabilities = CapabilityRegistrySchema.parse(
      JSON.parse(
        await Deno.readTextFile(join(root, "evals", "capabilities.json")),
      ),
    );
    const cases = await getCases();
    const casesById = new Map(cases.map((item) => [item.id, item]));
    const heldOut = new Set([
      "valid-unseen",
      "transfer",
      "adversarial",
      "test-frozen",
    ]);

    for (const capability of capabilities.capabilities) {
      const splits = new Set<EvalCaseType["split"] | undefined>(
        capability.evalIds.map((id) => casesById.get(id)?.split),
      );
      expect(splits.has("train"), capability.id).toBe(true);
      expect(splits.has("valid-seen"), capability.id).toBe(true);
      expect(
        [...splits].some((split) => split && heldOut.has(split)),
        capability.id,
      ).toBe(true);
    }
  });
});
