import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type EvalCase,
  EvalCaseFileSchema,
  SkillIdSchema,
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
  if (item.skill === targetSkill) return true;
  if (item.skill !== "composition") return false;
  const signals = new Set([
    ...item.expectedSkills,
    ...item.tags,
  ]);
  return signals.has(targetSkill) &&
    [...item.expectedSkills].every((skill) => installed.has(skill));
}

const allowedSplits = exportMode === "optimize"
  ? new Set(["train", "valid-seen"])
  : exportMode === "evaluate"
  ? new Set(["valid-unseen", "transfer", "adversarial"])
  : new Set(["test-frozen"]);
const cases = allCases.filter((item) =>
  allowedSplits.has(item.split) && targetsSkill(item)
);

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
const manifest = {
  schemaVersion: 2,
  mode: exportMode,
  targetSkill,
  companionSkills: companions,
  mutablePaths: [`candidate/skills/${targetSkill}/SKILL.md`],
  immutablePaths: companions.map((skill) => `companions/skills/${skill}`),
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
};
await Deno.writeTextFile(
  join(destination, "workspace.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Exported ${exportMode} workspace: ${destination}`);
