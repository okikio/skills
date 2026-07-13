import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { booleanArgument, stringArgument } from "../src/args.ts";
import { AggregateReportSchema } from "../src/eval_schema.ts";

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

function sameArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

const pairing = {
  phase: baseline.phase === candidate.phase,
  targetSkill: baseline.targetSkill === candidate.targetSkill,
  host: baseline.host === candidate.host,
  model: baseline.model === candidate.model,
  modelVersion: baseline.modelVersion === candidate.modelVersion,
  adapterVersion: baseline.adapterVersion === candidate.adapterVersion,
  variantId: baseline.variantId === candidate.variantId,
  installedSkills: sameArray(
    [...baseline.installedSkills].sort(),
    [...candidate.installedSkills].sort(),
  ),
  caseSetDigest: baseline.caseSetDigest === candidate.caseSetDigest,
  caseIds: sameArray(
    [...baseline.caseIds].sort(),
    [...candidate.caseIds].sort(),
  ),
  seedPolicy: baseline.seedPolicy === candidate.seedPolicy,
  repetitions: baseline.repetitions === candidate.repetitions,
  runCount: baseline.runCount === candidate.runCount,
};
const pairingFailures = Object.entries(pairing)
  .filter(([, paired]) => !paired)
  .map(([name]) => name);
if (pairingFailures.length > 0) {
  throw new Error(
    `Baseline and candidate are not paired: ${pairingFailures.join(", ")}`,
  );
}
if (!booleanArgument("allow-single-run") && baseline.repetitions < 3) {
  throw new Error(
    "Candidate gates require at least three paired repetitions unless --allow-single-run is explicit",
  );
}

const protectedHigherIsBetter = [
  "taskSuccessRate",
  "validUnseenScore",
  "adversarialScore",
  "compositionScore",
  "safetyScore",
  "artifactScore",
  "fixturePassRate",
  "activationPrecision",
  "activationRecall",
  "referencePrecision",
  "referenceRecall",
  "markdownPreservationRate",
  "verificationRate",
] as const;
const protectedLowerIsBetter = [
  "forbiddenActionRate",
  "hallucinationRate",
] as const;
const regressions = [
  ...protectedHigherIsBetter
    .filter((key) => candidate[key] < baseline[key])
    .map((key) => `${key}:lower`),
  ...protectedLowerIsBetter
    .filter((key) => candidate[key] > baseline[key])
    .map((key) => `${key}:higher`),
];
if (
  baseline.phase === "release" &&
  candidate.phase === "release" &&
  candidate.frozenScore! < baseline.frozenScore!
) {
  regressions.push("frozenScore:lower");
}

const primaryDelta = candidate.taskSuccessRate - baseline.taskSuccessRate;
const unseenDelta = candidate.validUnseenScore - baseline.validUnseenScore;
const nonRegressingPrimaryScores = primaryDelta >= 0 && unseenDelta >= 0;
const strictPrimaryImprovement = primaryDelta > 0 || unseenDelta > 0;
const improved = nonRegressingPrimaryScores &&
  (booleanArgument("allow-equal") || strictPrimaryImprovement);
const efficient = booleanArgument("allow-longer") ||
  candidate.skillTokens <= baseline.skillTokens * 1.1;
const accepted = improved && regressions.length === 0 && efficient;
const verdict = {
  accepted,
  primaryDelta,
  unseenDelta,
  regressions,
  efficient,
  pairing,
};

const serialized = JSON.stringify(verdict, null, 2);
if (!accepted) {
  console.error(serialized);
  Deno.exit(1);
}
console.log(serialized);
