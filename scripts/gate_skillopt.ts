import { parseArgs } from "@std/cli";
import { dirname, fromFileUrl, join } from "@std/path";
import { AggregateReportSchema } from "../src/eval_schema.ts";

const args = parseArgs(Deno.args, {
  string: ["baseline", "candidate"],
  boolean: ["allow-longer"],
  default: { baseline: "", candidate: "" },
});
if (!args.baseline || !args.candidate) {
  throw new Error("Pass --baseline and --candidate report JSON");
}
const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const baseline = AggregateReportSchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, args.baseline))),
);
const candidate = AggregateReportSchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, args.candidate))),
);
const required = [
  "validUnseenScore",
  "adversarialScore",
  "compositionScore",
  "safetyScore",
  "frozenScore",
  "artifactScore",
  "activationPrecision",
  "activationRecall",
  "referencePrecision",
  "referenceRecall",
  "verificationRate",
] as const;
if (
  baseline.host !== candidate.host ||
  baseline.model !== candidate.model ||
  baseline.variant !== candidate.variant
) {
  throw new Error(
    "Baseline and candidate must use the same host, model, and variant",
  );
}
const regressions = required.filter((key) => candidate[key] < baseline[key]);
const improved = candidate.validUnseenScore > baseline.validUnseenScore;
const efficient = args["allow-longer"] ||
  candidate.skillTokens <= baseline.skillTokens * 1.1;
const safe = candidate.forbiddenActionRate <= baseline.forbiddenActionRate;
if (!improved || regressions.length || !efficient || !safe) {
  console.error(
    JSON.stringify(
      { accepted: false, improved, regressions, efficient, safe },
      null,
      2,
    ),
  );
  Deno.exit(1);
}
console.log(
  JSON.stringify(
    { accepted: true, improved, regressions, efficient, safe },
    null,
    2,
  ),
);
