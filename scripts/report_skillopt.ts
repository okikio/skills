import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { collectedArguments, stringArgument } from "../src/args.ts";
import { walkFiles } from "../src/files.ts";
import * as hash from "../src/hash.ts";
import { EvalResultSchema } from "../src/evaluation.ts";
import * as report from "../src/report.ts";
import * as rollout from "../src/rollout.ts";
import * as tree from "../src/tree.ts";
import {
  type SkillOptWorkspaceType,
  verifyWorkspace,
} from "../src/workspace.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Resolve one repository-relative input and reject paths outside the checkout. */
function repositoryPath(input: string, label: string): string {
  const path = resolve(root, input);
  const relation = relative(root, path);
  if (isAbsolute(relation) || relation.startsWith("..")) {
    throw new Error(`${label} must remain inside the repository`);
  }
  return path;
}

/** Load every normalized result file below one repository-owned results tree. */
async function loadResults(path: string) {
  const results = [];
  for await (const file of walkFiles(path)) {
    if (basename(file) !== "result.json") continue;
    results.push(
      EvalResultSchema.parse(JSON.parse(await Deno.readTextFile(file))),
    );
  }
  if (results.length === 0) {
    throw new Error(`${relative(root, path)} contains no result.json files`);
  }
  return results;
}

const workspaceInputs = collectedArguments("workspace");
const resultsInput = stringArgument("results");
const benchmarkId = stringArgument("benchmark");
const gitRevision = stringArgument("git-revision");
const role = stringArgument("variant-role");
const outputInput = stringArgument("out");
if (
  workspaceInputs.length === 0 || !resultsInput || !benchmarkId ||
  !gitRevision || !role || !outputInput
) {
  throw new Error(
    "Pass --workspace, --results, --benchmark, --git-revision, " +
      "--variant-role, and --out to skillopt:report",
  );
}
if (role !== "baseline" && role !== "candidate") {
  throw new Error("--variant-role must be baseline or candidate");
}

const manifestPaths = workspaceInputs.map((input) =>
  repositoryPath(input, "SkillOpt workspace")
);
const verified = await Promise.all(manifestPaths.map(verifyWorkspace));
for (const item of verified) {
  if (item.failures.length > 0) throw new Error(item.failures.join("\n"));
  if (item.workspace.mode === "optimize") {
    throw new Error("skillopt:report accepts evaluate/release workspaces only");
  }
}
const workspaces = verified.map((item) => item.workspace);
report.checkWorkspaces(workspaces);
const evaluateIndexes = workspaces.flatMap((workspace, index) =>
  workspace.mode === "evaluate" ? [index] : []
);
const releaseIndexes = workspaces.flatMap((workspace, index) =>
  workspace.mode === "release" ? [index] : []
);
const phase = releaseIndexes.length > 0 ? "release" : "evaluate";
if (phase === "evaluate" && (workspaces.length !== 1 || evaluateIndexes.length !== 1)) {
  throw new Error("Evaluate reports require exactly one evaluate workspace");
}
if (
  phase === "release" &&
  (workspaces.length !== 2 || evaluateIndexes.length !== 1 || releaseIndexes.length !== 1)
) {
  throw new Error(
    "Release reports require exactly one evaluate workspace and one release workspace",
  );
}

const cases = new Map<string, report.ReportCaseType>();
for (let index = 0; index < workspaces.length; index++) {
  const workspace = workspaces[index]!;
  const workspaceRoot = dirname(manifestPaths[index]!);
  for (const record of workspace.cases) {
    if (cases.has(record.id)) {
      throw new Error(`${record.id}: case appears in more than one report workspace`);
    }
    cases.set(record.id, {
      item: await rollout.loadCase(workspaceRoot, record.id, record.digest),
      digest: record.digest,
      corpusDigest: workspace.caseSetDigest,
    });
  }
}
const caseSetDigest = await hash.text(
  [...cases.entries()]
    .map(([id, record]) => `${id}:${record.digest}`)
    .sort()
    .join("\n"),
);

const resultsRoot = repositoryPath(resultsInput, "SkillOpt results root");
const results = await loadResults(resultsRoot);
const targetSkill = workspaces[0]!.targetSkill;
const targetInstalled = results.every((result) =>
  result.installedSkills.includes(targetSkill)
);
const targetOmitted = results.every((result) =>
  !result.installedSkills.includes(targetSkill)
);
if (!targetInstalled && !targetOmitted) {
  throw new Error("Report mixes target-skill and no-skill rollout topologies");
}
const targetSkillBytes = targetOmitted
  ? 0
  : await tree.getBytes(
    join(dirname(manifestPaths[0]!), "candidate", "skills", targetSkill),
  );

const outputPath = repositoryPath(outputInput, "SkillOpt report output");
const aggregate = report.create({
  phase,
  reportId: stringArgument("report-id", crypto.randomUUID())!,
  createdAt: new Date().toISOString(),
  gitRevision,
  benchmarkId,
  optimizationUnit: workspaces[0]!.optimizationUnit,
  targetReference: workspaces[0]!.targetReference,
  variantRole: role,
  targetSkill,
  targetSkillBytes,
  caseSetDigest,
  cases,
  results,
});
await Deno.mkdir(dirname(outputPath), { recursive: true });
await Deno.writeTextFile(
  outputPath,
  `${JSON.stringify(aggregate, null, 2)}\n`,
);
console.log(outputPath);
