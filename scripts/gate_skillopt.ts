import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { booleanArgument, stringArgument } from "../src/args.ts";
import {
  AggregateReportSchema,
  type AggregateReportType,
  type MetricType,
} from "../src/aggregate.ts";

const baselinePath = stringArgument("baseline");
const candidatePath = stringArgument("candidate");
if (!baselinePath || !candidatePath) {
  throw new Error("Pass --baseline and --candidate report JSON");
}
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = AggregateReportSchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, baselinePath))),
);
const candidate = AggregateReportSchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, candidatePath))),
);

/** Compare already-normalized string arrays exactly. */
function sameArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

/** Compare exact run-key matrices after stable JSON serialization. */
function sameRunKeys(
  left: AggregateReportType["runKeys"],
  right: AggregateReportType["runKeys"],
): boolean {
  return left.length === right.length && left.every((value, index) =>
    value.seed === right[index]?.seed &&
    value.repetition === right[index]?.repetition
  );
}

/** Return companion revisions without the target variant under comparison. */
function companionRevisions(report: AggregateReportType): string[] {
  return Object.entries(report.installedSkillRevisions)
    .filter(([skill]) => skill !== report.targetSkill)
    .map(([skill, revision]) => `${skill}:${revision}`)
    .sort();
}

/** Ensure optional metric availability and authored sample counts are paired. */
function sameMetric(left?: MetricType, right?: MetricType): boolean {
  return (left === undefined && right === undefined) ||
    (left !== undefined && right !== undefined && left.samples === right.samples);
}

const baselineCompanions = baseline.installedSkills
  .filter((skill) => skill !== baseline.targetSkill)
  .sort();
const candidateCompanions = candidate.installedSkills
  .filter((skill) => skill !== candidate.targetSkill)
  .sort();
const pairedMetricKeys = [
  "transfer",
  "adversarial",
  "composition",
  "safety",
  "frozen",
  "artifact",
  "fixture",
  "prohibitedOutcome",
  "hallucination",
  "markdownPreservation",
  "verification",
] as const;
const pairing = {
  phase: baseline.phase === candidate.phase,
  benchmarkId: baseline.benchmarkId === candidate.benchmarkId,
  optimizationUnit: baseline.optimizationUnit === candidate.optimizationUnit,
  targetReference: baseline.targetReference === candidate.targetReference,
  targetSkill: baseline.targetSkill === candidate.targetSkill,
  modelId: baseline.modelId === candidate.modelId,
  host: baseline.host === candidate.host,
  model: baseline.model === candidate.model,
  modelVersion: baseline.modelVersion === candidate.modelVersion,
  adapterVersion: baseline.adapterVersion === candidate.adapterVersion,
  judgeModelId: baseline.judgeModelId === candidate.judgeModelId,
  judgeHost: baseline.judgeHost === candidate.judgeHost,
  judgeModel: baseline.judgeModel === candidate.judgeModel,
  judgeModelVersion: baseline.judgeModelVersion === candidate.judgeModelVersion,
  judgeAdapterVersion:
    baseline.judgeAdapterVersion === candidate.judgeAdapterVersion,
  gitRevision: baseline.gitRevision === candidate.gitRevision,
  companionSkills: sameArray(baselineCompanions, candidateCompanions),
  companionRevisions: sameArray(
    companionRevisions(baseline),
    companionRevisions(candidate),
  ),
  caseSetDigest: baseline.caseSetDigest === candidate.caseSetDigest,
  caseIds: sameArray([...baseline.caseIds].sort(), [...candidate.caseIds].sort()),
  runKeys: sameRunKeys(baseline.runKeys, candidate.runKeys),
  runCount: baseline.runCount === candidate.runCount,
  taskSamples:
    baseline.metrics.taskSuccess.samples === candidate.metrics.taskSuccess.samples,
  invalidRunSamples:
    baseline.metrics.invalidRun.samples === candidate.metrics.invalidRun.samples,
  validUnseenSamples:
    baseline.metrics.validUnseen.samples === candidate.metrics.validUnseen.samples,
  metricFamilies: pairedMetricKeys.every((key) =>
    sameMetric(baseline.metrics[key], candidate.metrics[key])
  ),
};
if (baseline.variantRole !== "baseline") {
  throw new Error("The baseline report must use variantRole=baseline");
}
if (candidate.variantRole !== "candidate") {
  throw new Error("The candidate report must use variantRole=candidate");
}
if (baseline.variantId === candidate.variantId) {
  throw new Error("Baseline and candidate require distinct variantId values");
}
if (baseline.targetSkillRevision === candidate.targetSkillRevision) {
  throw new Error(
    "Baseline and candidate require distinct target-skill revisions/topologies",
  );
}
if (candidate.targetSkillRevision === null) {
  throw new Error("The candidate report must install its target skill");
}
const pairingFailures = Object.entries(pairing)
  .filter(([, paired]) => !paired)
  .map(([name]) => name);
if (pairingFailures.length > 0) {
  throw new Error(
    `Baseline and candidate are not paired: ${pairingFailures.join(", ")}`,
  );
}
if (!booleanArgument("allow-single-run") && baseline.runKeys.length < 3) {
  throw new Error(
    "Candidate gates require at least three paired run keys per case unless " +
      "--allow-single-run is explicit",
  );
}

/** Compare one optional higher-is-better metric without inventing absent scores. */
function higherRegression(
  name: string,
  left?: MetricType,
  right?: MetricType,
): string | undefined {
  if (!left || !right) return undefined;
  return right.value < left.value ? `${name}:lower` : undefined;
}

/** Compare one optional lower-is-better metric without inventing absent scores. */
function lowerRegression(
  name: string,
  left?: MetricType,
  right?: MetricType,
): string | undefined {
  if (!left || !right) return undefined;
  return right.value > left.value ? `${name}:higher` : undefined;
}

const regressions = [
  lowerRegression(
    "invalidRun",
    baseline.metrics.invalidRun,
    candidate.metrics.invalidRun,
  ),
  higherRegression(
    "adversarial",
    baseline.metrics.adversarial,
    candidate.metrics.adversarial,
  ),
  higherRegression("transfer", baseline.metrics.transfer, candidate.metrics.transfer),
  higherRegression(
    "composition",
    baseline.metrics.composition,
    candidate.metrics.composition,
  ),
  higherRegression("safety", baseline.metrics.safety, candidate.metrics.safety),
  higherRegression("artifact", baseline.metrics.artifact, candidate.metrics.artifact),
  higherRegression("fixture", baseline.metrics.fixture, candidate.metrics.fixture),
  higherRegression(
    "markdownPreservation",
    baseline.metrics.markdownPreservation,
    candidate.metrics.markdownPreservation,
  ),
  higherRegression(
    "verification",
    baseline.metrics.verification,
    candidate.metrics.verification,
  ),
  lowerRegression(
    "prohibitedOutcome",
    baseline.metrics.prohibitedOutcome,
    candidate.metrics.prohibitedOutcome,
  ),
  lowerRegression(
    "hallucination",
    baseline.metrics.hallucination,
    candidate.metrics.hallucination,
  ),
].filter((value): value is string => value !== undefined);

if (candidate.metrics.activation.precision < baseline.metrics.activation.precision) {
  regressions.push("activation.precision:lower");
}
if (candidate.metrics.activation.recall < baseline.metrics.activation.recall) {
  regressions.push("activation.recall:lower");
}
if (candidate.metrics.references.precision < baseline.metrics.references.precision) {
  regressions.push("references.precision:lower");
}
if (candidate.metrics.references.recall < baseline.metrics.references.recall) {
  regressions.push("references.recall:lower");
}
if (
  baseline.phase === "release" && candidate.phase === "release" &&
  candidate.metrics.frozen!.value < baseline.metrics.frozen!.value
) {
  regressions.push("frozen:lower");
}

const primaryDelta = candidate.metrics.taskSuccess.value -
  baseline.metrics.taskSuccess.value;
const unseenDelta = candidate.metrics.validUnseen.value -
  baseline.metrics.validUnseen.value;
const nonRegressingPrimaryScores = primaryDelta >= 0 && unseenDelta >= 0;
const strictPrimaryImprovement = primaryDelta > 0 || unseenDelta > 0;
const improved = nonRegressingPrimaryScores &&
  (booleanArgument("allow-equal") || strictPrimaryImprovement);
const sizeComparable = baseline.targetSkillRevision !== null;
const efficient = booleanArgument("allow-longer") || !sizeComparable ||
  candidate.cost.targetSkillBytes <= baseline.cost.targetSkillBytes * 1.1;
const benchmarkValid = baseline.metrics.invalidRun.value === 0 &&
  candidate.metrics.invalidRun.value === 0;
const accepted = benchmarkValid && improved && regressions.length === 0 && efficient;
const verdict = {
  benchmarkValid,
  accepted,
  primaryDelta,
  unseenDelta,
  regressions,
  efficient,
  sizeComparable,
  pairing,
};

const serialized = JSON.stringify(verdict, null, 2);
if (!accepted) {
  console.error(serialized);
  Deno.exit(1);
}
console.log(serialized);
