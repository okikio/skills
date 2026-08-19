import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CapabilityRegistrySchema,
  type EvalCaseType,
  EvalCaseFileSchema,
  SourceRegistrySchema,
} from "../src/corpus.ts";
import { walkFiles } from "../src/files.ts";

/** Repository root used to compare skill references with the evaluation ledger. */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Return every shipped reference as `<skill>/references/<path>.md`. */
async function getReferences(): Promise<string[]> {
  const references: string[] = [];
  for await (const skill of Deno.readDir(join(root, "skills"))) {
    if (!skill.isDirectory) continue;
    const directory = join(root, "skills", skill.name, "references");
    try {
      for await (const path of walkFiles(directory)) {
        if (!path.endsWith(".md")) continue;
        const reference = relative(
          join(root, "skills", skill.name),
          path,
        );
        references.push(`${skill.name}/${reference}`);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return references.sort();
}

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
  it("maps every shipped reference to a sourced capability", async () => {
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
    const knownSources = new Set(sources.sources.map((source) => source.id));
    const mapped = new Set(
      capabilities.capabilities.map((capability) =>
        `${capability.skill}/${capability.reference}`
      ),
    );

    expect(await getReferences()).toEqual([...mapped].sort());
    expect(
      capabilities.capabilities.every((capability) =>
        capability.sourceIds.every((source) => knownSources.has(source))
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
