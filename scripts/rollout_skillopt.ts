import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
import { booleanArgument, stringArgument } from "../src/args.ts";
import { ModelRegistrySchema } from "../src/model.ts";
import { redactValue } from "../src/redact.ts";
import { EvalResultSchema } from "../src/evaluation.ts";
import * as rollout from "../src/rollout.ts";
import { verifyWorkspace } from "../src/workspace.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Parse one integer CLI argument while preserving an explicit zero. */
function integerArgument(name: string, fallback: number): number {
  const raw = stringArgument(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`--${name} must be an integer`);
  }
  return value;
}

const workspaceInput = stringArgument("workspace");
const caseId = stringArgument("case");
const modelId = stringArgument("model");
const variantId = stringArgument("variant");
if (!workspaceInput || !caseId || !modelId || !variantId) {
  throw new Error(
    "Pass --workspace, --case, --model, and --variant to skillopt:rollout",
  );
}

const manifestPath = resolve(root, workspaceInput);
const relation = relative(root, manifestPath);
if (isAbsolute(relation) || relation.startsWith("..")) {
  throw new Error("SkillOpt workspace must remain inside the repository");
}
const workspaceRoot = dirname(manifestPath);
const verified = await verifyWorkspace(manifestPath);
if (verified.failures.length > 0) {
  throw new Error(verified.failures.join("\n"));
}
const workspace = verified.workspace;
const caseRecord = workspace.cases.find((record) => record.id === caseId);
if (!caseRecord) throw new Error(`Unknown workspace case: ${caseId}`);
const evaluation = await rollout.loadCase(
  workspaceRoot,
  caseId,
  caseRecord.digest,
);

const registry = ModelRegistrySchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, "evals", "models.json"))),
);
const targetModel = registry.models.find((adapter) => adapter.id === modelId);
if (!targetModel) throw new Error(`Unknown model adapter: ${modelId}`);
if (!targetModel.requests.includes("rollout")) {
  throw new Error(`Model adapter ${modelId} does not support rollout requests`);
}
const allowDisabled = booleanArgument("allow-disabled");
const withoutTarget = booleanArgument("without-target");
if (!targetModel.enabled && !allowDisabled) {
  throw new Error(
    `Model adapter ${modelId} is disabled; configure and enable it first`,
  );
}

const requiresJudge = evaluation.oracleStrength === "trajectory-rubric" ||
  evaluation.oracleStrength === "mixed";
const judgeId = stringArgument("judge");
const judgeModel = judgeId
  ? registry.models.find((candidate) => candidate.id === judgeId)
  : undefined;
if (requiresJudge && !judgeId) {
  throw new Error(
    `Case ${caseId} uses ${evaluation.oracleStrength}; pass --judge with a ` +
      "configured qualitative judge adapter",
  );
}
if (!requiresJudge && judgeId) {
  throw new Error(
    `Case ${caseId} uses ${evaluation.oracleStrength} and does not require a qualitative judge`,
  );
}
if (judgeId && !judgeModel) throw new Error(`Unknown judge adapter: ${judgeId}`);
if (requiresJudge && judgeModel && !judgeModel.requests.includes("judge")) {
  throw new Error(`Judge adapter ${judgeModel.id} does not support judge requests`);
}
if (requiresJudge && judgeModel && !judgeModel.enabled && !allowDisabled) {
  throw new Error(
    `Judge adapter ${judgeModel.id} is disabled; configure and enable it first`,
  );
}

const runId = stringArgument("run-id", crypto.randomUUID())!;
const seed = integerArgument("seed", 0);
const repetition = integerArgument("repetition", 0);
if (repetition < 0) throw new Error("--repetition cannot be negative");
const runRoot = resolve(
  root,
  stringArgument("out", join(".skillopt", "runs", runId))!,
);
const runRelation = relative(root, runRoot);
if (isAbsolute(runRelation) || runRelation.startsWith("..")) {
  throw new Error("SkillOpt output must remain inside the repository");
}

const evidence = await rollout.evaluate({
  manifestPath,
  workspaceRoot,
  workspace,
  caseRecord,
  evaluation,
  targetModel,
  judgeModel,
  withoutTarget,
  variantId,
  runId,
  seed,
  repetition,
});

await Deno.mkdir(runRoot, { recursive: true });
const result = EvalResultSchema.parse(
  redactValue(evidence.result, evidence.secrets),
);
await Deno.writeTextFile(
  join(runRoot, "result.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
await Deno.writeTextFile(
  join(runRoot, "trace.json"),
  `${JSON.stringify(redactValue(evidence.trace, evidence.secrets), null, 2)}\n`,
);
console.log(join(runRoot, "result.json"));
if (!result.passed) Deno.exit(1);
