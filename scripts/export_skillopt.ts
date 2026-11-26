import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EvalCaseFileSchema,
  type EvalCaseType,
  SkillIdSchema,
} from "../src/corpus.ts";
import {
  SkillOptWorkspaceSchema,
  type SkillOptWorkspaceType,
  verifyWorkspace,
} from "../src/workspace.ts";
import { collectedArguments, stringArgument } from "../src/args.ts";
import { copyDirectory, walkFiles } from "../src/files.ts";
import {
  BundleManifestSchema,
  type BundleResult,
  materializeSkill,
  pinCandidate,
} from "../src/bundle.ts";
import {
  physicalDirectory,
  resolveReference,
  safeOutput,
  sourceFile,
} from "../src/guidance.ts";
import { containsPath, DocumentPathSchema } from "../src/paths.ts";
import * as hash from "../src/hash.ts";
import * as tree from "../src/tree.ts";

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
  DocumentPathSchema.parse(reference);
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

const root = await Deno.realPath(
  join(dirname(fileURLToPath(import.meta.url)), ".."),
);
const candidateManifest = stringArgument("candidate-workspace");
let candidate: { root: string; workspace: SkillOptWorkspaceType } | undefined;
if (candidateManifest) {
  if (exportMode === "optimize") {
    throw new Error(
      "--candidate-workspace is only for evaluation or release exports",
    );
  }
  const requestedManifest = resolve(candidateManifest);
  const candidateRoot = await physicalDirectory(dirname(requestedManifest));
  const manifestPath = await sourceFile(
    candidateRoot,
    basename(requestedManifest),
  );
  const workspace = SkillOptWorkspaceSchema.parse(
    JSON.parse(await Deno.readTextFile(manifestPath)),
  );
  // Check mode before verifying data, so candidate selection never reads frozen inputs.
  if (workspace.mode !== "optimize") {
    throw new Error("Candidate workspace must use optimize mode");
  }
  if (
    workspace.targetSkill !== targetSkill ||
    workspace.targetReference !== references[0] ||
    workspace.optimizationUnit !==
      (references.length === 0 ? "root-router" : "reference") ||
    JSON.stringify([...workspace.companionSkills].sort()) !==
      JSON.stringify(companions)
  ) {
    throw new Error(
      "Candidate workspace target, reference or companion identity differs from export options",
    );
  }
  const verified = await verifyWorkspace(manifestPath);
  if (verified.failures.length > 0) {
    throw new Error(verified.failures.join("\n"));
  }
  candidate = { root: candidateRoot, workspace: verified.workspace };
  if (stringArgument("ref") !== undefined) {
    throw new Error("Candidate export retains its source ref; omit --ref");
  }
}
for (const skill of [targetSkill, ...companions]) {
  await sourceFile(root, `skills/${skill}/SKILL.md`);
}
for (const reference of references) {
  await resolveReference(root, `${targetSkill}/${reference}`);
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

/** Select cases whose positive requirements fit the explicitly installed skills. */
function targetsSkill(item: EvalCaseType): boolean {
  const requiredSkills = new Set([
    ...item.expectedSkills,
    ...item.requiredReferences.map((reference) => reference.split("/")[0]),
  ]);
  const targets = item.skill === targetSkill ||
    (item.skill === "composition" &&
      item.expectedSkills.includes(targetSkill) &&
      item.forbiddenSkills.every((skill) => installed.has(skill)));
  if (!targets || ![...requiredSkills].every((skill) => installed.has(skill))) {
    return false;
  }
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
if (exportMode === "evaluate" && cases.length === 0) {
  throw new Error(
    `Evaluate export for ${targetSkill} has no eligible held-out cases for the installed skill set`,
  );
}
if (exportMode === "optimize") {
  for (const split of ["train", "valid-seen"]) {
    if (!cases.some((item) => item.split === split)) {
      throw new Error(
        `${targetSkill}/${
          references[0] ?? "SKILL.md"
        } requires at least one ${split} case`,
      );
    }
  }
}

const destination = await safeOutput(
  root,
  join(root, ".skillopt", targetSkill, exportMode),
);
if (candidate) {
  candidate.root = await physicalDirectory(candidate.root);
  if (
    containsPath(destination, candidate.root) ||
    containsPath(candidate.root, destination)
  ) {
    throw new Error(
      "Candidate input and export output must be separate trees",
    );
  }
}
await Deno.remove(destination, { recursive: true }).catch((error) => {
  if (!(error instanceof Deno.errors.NotFound)) throw error;
});
await Deno.mkdir(join(destination, "data"), { recursive: true });

const sourceRef = stringArgument("ref", "main");
const bundles: BundleResult[] = [];
if (candidate) {
  for (const skill of [targetSkill, ...companions]) {
    const path = `${
      skill === targetSkill ? "candidate" : "companions"
    }/skills/${skill}`;
    await copyDirectory(join(candidate.root, path), join(destination, path));
  }
  for (
    const [path, digest] of Object.entries(candidate.workspace.immutableDigests)
  ) {
    if (await hash.file(await sourceFile(destination, path)) !== digest) {
      throw new Error(
        `Candidate immutable dependency changed while copying: ${path}`,
      );
    }
  }
  bundles.push(
    await pinCandidate(
      join(destination, "candidate", "skills", targetSkill),
      targetSkill,
      references[0] ?? "SKILL.md",
    ),
  );
  for (const skill of companions) {
    const directory = join(destination, "companions", "skills", skill);
    const manifest = BundleManifestSchema.parse(
      JSON.parse(await Deno.readTextFile(join(directory, "bundle.json"))),
    );
    const revision = await tree.getDigest(directory);
    if (revision !== candidate.workspace.skillRevisions[skill]) {
      throw new Error(`Candidate companion changed while copying: ${skill}`);
    }
    bundles.push({ skill, revision, manifest });
  }
} else {
  bundles.push(
    await materializeSkill(
      root,
      targetSkill,
      join(destination, "candidate", "skills", targetSkill),
      { sourceRef },
    ),
  );
  for (const skill of companions) {
    bundles.push(
      await materializeSkill(
        root,
        skill,
        join(destination, "companions", "skills", skill),
        { sourceRef },
      ),
    );
  }
}
for (const reference of references) {
  await sourceFile(
    join(destination, "candidate", "skills", targetSkill),
    reference,
  );
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
  digest: await hash.text(JSON.stringify(item)),
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
const candidateRoot = join(destination, "candidate", "skills", targetSkill);
for await (const path of walkFiles(candidateRoot)) {
  const candidatePath = `candidate/skills/${targetSkill}/${
    relative(candidateRoot, path).replaceAll("\\", "/")
  }`;
  if (!mutablePathSet.has(candidatePath)) immutablePaths.push(candidatePath);
}
for (const skill of companions) {
  const companionRoot = join(destination, "companions", "skills", skill);
  for await (const path of walkFiles(companionRoot)) {
    immutablePaths.push(
      `companions/skills/${skill}/${
        relative(companionRoot, path).replaceAll("\\", "/")
      }`,
    );
  }
}
const sortedImmutablePaths = [...new Set(immutablePaths)].sort();
const immutableDigests = Object.fromEntries(
  await Promise.all(sortedImmutablePaths.map(async (path) => [
    path,
    await hash.file(join(destination, path)),
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
    bundles.map(({ skill, revision }) => [skill, revision]),
  ),
  cases: caseRecords,
  caseSetDigest: await hash.text(
    caseRecords.map((item) => `${item.id}:${item.digest}`).sort().join("\n"),
  ),
});
await Deno.writeTextFile(
  join(destination, "workspace.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`Exported ${exportMode} workspace: ${destination}`);
