import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type EvalCase,
  EvalCaseFileSchema,
  SkillIdSchema,
  SkillOptWorkspaceSchema,
} from "../src/eval_schema.ts";
import { collectedArguments, stringArgument } from "../src/args.ts";
import { copyDirectory, walkFiles } from "../src/files.ts";

const targetSkill = SkillIdSchema.parse(
  stringArgument("skill", "deno-software"),
);
const companions = [
  ...new Set(
    collectedArguments("with").map((value) => SkillIdSchema.parse(value)),
  ),
]
  .filter((value) => value !== targetSkill)
  .sort();
const references = [...new Set(collectedArguments("reference"))];
if (references.length > 1) {
  throw new Error("Optimize one reference at a time for attributable results");
}
for (const reference of references) {
  if (
    !/^references\/[a-z0-9][a-z0-9._/-]*\.md$/.test(reference) ||
    reference.split("/").includes("..")
  ) {
    throw new Error(`Invalid reference path: ${reference}`);
  }
}
const mode = stringArgument("mode", "optimize");
if (
  !(["optimize", "evaluate", "release"] as const).includes(
    mode as "optimize" | "evaluate" | "release",
  )
) {
  throw new Error("--mode must be optimize, evaluate, or release");
}
const exportMode = mode as "optimize" | "evaluate" | "release";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillRoot = join(root, "skills");
for (const skill of [targetSkill, ...companions]) {
  try {
    await Deno.stat(join(skillRoot, skill, "SKILL.md"));
  } catch {
    throw new Error(`Unknown skill: ${skill}`);
  }
}
for (const reference of references) {
  try {
    await Deno.stat(join(skillRoot, targetSkill, reference));
  } catch {
    throw new Error(`Unknown target reference: ${reference}`);
  }
}

const destination = join(root, ".skillopt", targetSkill, exportMode);
await Deno.remove(destination, { recursive: true }).catch((error) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});
await Deno.mkdir(join(destination, "data"), { recursive: true });

await copyDirectory(
  join(skillRoot, targetSkill),
  join(destination, "candidate", "skills", targetSkill),
);
for (const skill of companions) {
  await copyDirectory(
    join(skillRoot, skill),
    join(destination, "companions", "skills", skill),
  );
}

const encoder = new TextEncoder();
async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function treeDigest(path: string): Promise<string> {
  const entries: string[] = [];
  for await (const entry of walkFiles(path)) {
    const name = relative(path, entry);
    entries.push(
      `${name}\0${await digest(await Deno.readTextFile(entry))}`,
    );
  }
  return await digest(entries.sort().join("\n"));
}

const casePaths: string[] = [];
for await (const path of walkFiles(join(root, "evals", "cases"))) {
  if (path.endsWith(".json")) casePaths.push(path);
}

const allCases = (
  await Promise.all(
    casePaths.sort().map(async (path) =>
      EvalCaseFileSchema.parse(
        JSON.parse(await Deno.readTextFile(path)),
      ).cases
    ),
  )
).flat();

const installed = new Set([targetSkill, ...companions]);
function targetsSkill(item: EvalCase): boolean {
  const compositionSkills = new Set([
    ...item.expectedSkills,
    ...item.forbiddenSkills,
  ]);
  const targets = item.skill === targetSkill ||
    (item.skill === "composition" &&
      item.expectedSkills.includes(targetSkill) &&
      [...compositionSkills].every((skill) => installed.has(skill)));
  if (!targets) return false;
  if (references.length === 0) return true;
  return item.requiredReferences.includes(
    `${targetSkill}/${references[0]}`,
  );
}

const allowedSplits = exportMode === "optimize"
  ? new Set(["train", "valid-seen"])
  : exportMode === "evaluate"
  ? new Set(["valid-unseen", "transfer", "adversarial"])
  : new Set(["test-frozen"]);
const cases = allCases.filter((item) =>
  allowedSplits.has(item.split) && targetsSkill(item)
);

if (exportMode === "release" && cases.length === 0) {
  throw new Error(
    `Release export for ${targetSkill} has no frozen cases for the installed skill set`,
  );
}
if (exportMode === "optimize" && references.length > 0) {
  for (const split of ["train", "valid-seen"]) {
    if (!cases.some((item) => item.split === split)) {
      throw new Error(
        `${targetSkill}/${references[0]} requires at least one ${split} case`,
      );
    }
  }
}

for (const split of [...allowedSplits]) {
  const items = cases.filter((item) => item.split === split);
  await Deno.writeTextFile(
    join(destination, "data", `${split}.jsonl`),
    items.length === 0
      ? ""
      : `${items.map((item) => JSON.stringify(item)).join("\n")}\n`,
  );
}

const caseRecords = await Promise.all(cases.map(async (item) => ({
  id: item.id,
  digest: await digest(JSON.stringify(item)),
})));
const mutablePaths = exportMode !== "optimize"
  ? []
  : references.length === 0
  ? [`candidate/skills/${targetSkill}/SKILL.md`]
  : references.map((reference) =>
    `candidate/skills/${targetSkill}/${reference}`
  );
const mutablePathSet = new Set(mutablePaths);
const immutablePaths: string[] = [];
for await (const path of walkFiles(join(skillRoot, targetSkill))) {
  const candidatePath = `candidate/skills/${targetSkill}/${
    relative(join(skillRoot, targetSkill), path)
  }`;
  if (!mutablePathSet.has(candidatePath)) immutablePaths.push(candidatePath);
}
for (const skill of companions) {
  const companionRoot = join(destination, "companions", "skills", skill);
  for await (const path of walkFiles(companionRoot)) {
    immutablePaths.push(
      `companions/skills/${skill}/${relative(companionRoot, path)}`,
    );
  }
}
const sortedImmutablePaths = [...new Set(immutablePaths)].sort();
const immutableDigests = Object.fromEntries(
  await Promise.all(sortedImmutablePaths.map(async (path) => [
    path,
    await digest(await Deno.readTextFile(join(destination, path))),
  ])),
);
const manifest = SkillOptWorkspaceSchema.parse({
  schemaVersion: 2,
  mode: exportMode,
  optimizationUnit: references.length === 0 ? "root-router" : "reference",
  targetSkill,
  targetReference: references[0],
  companionSkills: companions,
  mutablePaths,
  immutablePaths: sortedImmutablePaths,
  immutableDigests,
  skillRevisions: Object.fromEntries(
    await Promise.all([targetSkill, ...companions].map(async (skill) => [
      skill,
      await treeDigest(join(skillRoot, skill)),
    ])),
  ),
  cases: caseRecords,
  caseSetDigest: await digest(
    caseRecords.map((item) => `${item.id}:${item.digest}`).sort().join("\n"),
  ),
});
await Deno.writeTextFile(
  join(destination, "workspace.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Exported ${exportMode} workspace: ${destination}`);
