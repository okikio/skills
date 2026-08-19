import { z } from "zod";
import { SkillIdSchema } from "./corpus.ts";
import { ModelHostSchema } from "./model.ts";

/** Mean or rate together with the number of rollout results behind it. */
export const MetricSchema = z.strictObject({
  /** Normalized metric value. Rates and case scores remain in the 0..1 range. */
  value: z.number().min(0).max(1),
  /** Number of concrete observations used to compute `value`. */
  samples: z.number().int().positive(),
});
export type MetricType = z.infer<typeof MetricSchema>;

/** Mean numeric measurement whose unit is supplied by the containing field. */
export const MeanSchema = z.strictObject({
  /** Arithmetic mean over the observations represented by this field. */
  value: z.number().nonnegative(),
  /** Number of concrete observations contributing to the mean. */
  samples: z.number().int().positive(),
});
export type MeanType = z.infer<typeof MeanSchema>;

/** Micro-averaged selection quality for routed skills or references. */
export const SelectionMetricSchema = z.strictObject({
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  truePositive: z.number().int().nonnegative(),
  falsePositive: z.number().int().nonnegative(),
  falseNegative: z.number().int().nonnegative(),
});
export type SelectionMetricType = z.infer<typeof SelectionMetricSchema>;

/** Score families derived from exact case metadata and normalized rollout data. */
export const ReportMetricsSchema = z.strictObject({
  /** Fraction of all rollouts whose complete deterministic/qualitative contract passed. */
  taskSuccess: MetricSchema,
  /** Fraction of runs invalidated by provider, judge, telemetry, or integrity failures. */
  invalidRun: MetricSchema,
  /** Mean normalized score over valid-unseen cases. Required for every report. */
  validUnseen: MetricSchema,
  /** Mean normalized score over transfer cases when the exported suite contains them. */
  transfer: MetricSchema.optional(),
  /** Mean normalized score over adversarial cases when present. */
  adversarial: MetricSchema.optional(),
  /** Mean normalized score over composition cases when present. */
  composition: MetricSchema.optional(),
  /** Mean normalized score over safety cases when present. */
  safety: MetricSchema.optional(),
  /** Mean normalized score over frozen release cases. Required only for release reports. */
  frozen: MetricSchema.optional(),
  /** Mean normalized score over artifact cases when present. */
  artifact: MetricSchema.optional(),
  /** Pass rate over cases with a concrete repository fixture. */
  fixture: MetricSchema.optional(),
  /** Micro-averaged expected-versus-observed skill activation. */
  activation: SelectionMetricSchema,
  /** Micro-averaged required-versus-observed reference loading. */
  references: SelectionMetricSchema,
  /** Rate of explicit forbidden-skill/reference or negative-assertion violations. */
  prohibitedOutcome: MetricSchema.optional(),
  /** Failure rate over cases explicitly tagged `anti-hallucination`. */
  hallucination: MetricSchema.optional(),
  /** Pass rate over cases explicitly tagged `markdown`. */
  markdownPreservation: MetricSchema.optional(),
  /** Pass rate over cases explicitly tagged `verification`. */
  verification: MetricSchema.optional(),
});
export type ReportMetricsType = z.infer<typeof ReportMetricsSchema>;

/** Runtime and artifact-size measurements kept separate from quality scores. */
export const ReportCostSchema = z.strictObject({
  targetDurationMs: MeanSchema,
  judgeDurationMs: MeanSchema.optional(),
  toolCalls: MeanSchema,
  commands: MeanSchema,
  outputCharacters: MeanSchema,
  inputTokens: MeanSchema.optional(),
  outputTokens: MeanSchema.optional(),
  judgeInputTokens: MeanSchema.optional(),
  judgeOutputTokens: MeanSchema.optional(),
  changedFiles: MeanSchema,
  addedLines: MeanSchema,
  deletedLines: MeanSchema,
  /** Complete file bytes in the installed target skill tree. Zero for a no-skill baseline. */
  targetSkillBytes: z.number().int().nonnegative(),
});
export type ReportCostType = z.infer<typeof ReportCostSchema>;

/** Exact seed/repetition pair executed for every case in one aggregate report. */
export const RunKeySchema = z.strictObject({
  seed: z.number().int(),
  repetition: z.number().int().nonnegative(),
});
export type RunKeyType = z.infer<typeof RunKeySchema>;

/**
 * Aggregate benchmark report used to compare paired baseline/candidate runs.
 *
 * Metrics carry sample counts so an inapplicable metric cannot be confused with
 * a perfect score. A release report combines the held-out evaluation workspace
 * with its frozen release workspace and therefore preserves both unseen and
 * frozen evidence in one paired artifact.
 */
export const AggregateReportSchema = z.strictObject({
  schemaVersion: z.literal(4),
  phase: z.enum(["evaluate", "release"]),
  reportId: z.string().min(1),
  createdAt: z.iso.datetime(),
  gitRevision: z.string().min(1),
  benchmarkId: z.string().min(1),
  optimizationUnit: z.enum(["root-router", "reference"]),
  targetSkill: SkillIdSchema,
  targetReference: z.string().optional(),
  /** Null only when this variant deliberately omits the target skill. */
  targetSkillRevision: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  modelId: z.string(),
  host: ModelHostSchema,
  model: z.string(),
  modelVersion: z.string(),
  adapterVersion: z.string(),
  judgeModelId: z.string().optional(),
  judgeHost: ModelHostSchema.optional(),
  judgeModel: z.string().optional(),
  judgeModelVersion: z.string().optional(),
  judgeAdapterVersion: z.string().optional(),
  variantRole: z.enum(["baseline", "candidate"]),
  variantId: z.string(),
  installedSkills: z.array(SkillIdSchema),
  installedSkillRevisions: z.record(
    SkillIdSchema,
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  /** Digest of the exact case-id/case-digest set represented by this report. */
  caseSetDigest: z.string().regex(/^[a-f0-9]{64}$/),
  caseIds: z.array(z.string()).min(1),
  /** Exact run matrix. Every case must have every key exactly once. */
  runKeys: z.array(RunKeySchema).min(1),
  runCount: z.number().int().positive(),
  metrics: ReportMetricsSchema,
  cost: ReportCostSchema,
}).superRefine((value, context) => {
  if (value.optimizationUnit === "reference" && !value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "reference reports require targetReference",
      path: ["targetReference"],
    });
  }
  if (value.optimizationUnit === "root-router" && value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "root-router reports cannot set targetReference",
      path: ["targetReference"],
    });
  }
  if (new Set(value.installedSkills).size !== value.installedSkills.length) {
    context.addIssue({
      code: "custom",
      message: "installedSkills must be unique",
      path: ["installedSkills"],
    });
  }
  const installed = [...value.installedSkills].sort();
  const revisions = Object.keys(value.installedSkillRevisions).sort();
  if (installed.length !== revisions.length ||
    installed.some((skill, index) => skill !== revisions[index])) {
    context.addIssue({
      code: "custom",
      message: "installedSkillRevisions must match installedSkills exactly",
      path: ["installedSkillRevisions"],
    });
  }
  if (new Set(value.caseIds).size !== value.caseIds.length) {
    context.addIssue({
      code: "custom",
      message: "caseIds must be unique",
      path: ["caseIds"],
    });
  }
  const runIdentities = value.runKeys.map((key) => `${key.seed}:${key.repetition}`);
  if (new Set(runIdentities).size !== runIdentities.length) {
    context.addIssue({
      code: "custom",
      message: "runKeys must be unique",
      path: ["runKeys"],
    });
  }
  if (value.runCount !== value.caseIds.length * value.runKeys.length) {
    context.addIssue({
      code: "custom",
      message: "runCount must equal caseIds × runKeys",
      path: ["runCount"],
    });
  }

  const completeSamples = [
    ["metrics.taskSuccess", value.metrics.taskSuccess.samples],
    ["metrics.invalidRun", value.metrics.invalidRun.samples],
    ["cost.targetDurationMs", value.cost.targetDurationMs.samples],
    ["cost.toolCalls", value.cost.toolCalls.samples],
    ["cost.commands", value.cost.commands.samples],
    ["cost.outputCharacters", value.cost.outputCharacters.samples],
    ["cost.changedFiles", value.cost.changedFiles.samples],
    ["cost.addedLines", value.cost.addedLines.samples],
    ["cost.deletedLines", value.cost.deletedLines.samples],
  ] as const;
  for (const [name, samples] of completeSamples) {
    if (samples !== value.runCount) {
      context.addIssue({
        code: "custom",
        message: `${name} samples must equal runCount`,
        path: name.split("."),
      });
    }
  }
  const optionalMeans = [
    ["judgeDurationMs", value.cost.judgeDurationMs],
    ["inputTokens", value.cost.inputTokens],
    ["outputTokens", value.cost.outputTokens],
    ["judgeInputTokens", value.cost.judgeInputTokens],
    ["judgeOutputTokens", value.cost.judgeOutputTokens],
  ] as const;
  for (const [name, measurement] of optionalMeans) {
    if (measurement && measurement.samples > value.runCount) {
      context.addIssue({
        code: "custom",
        message: `${name} samples cannot exceed runCount`,
        path: ["cost", name],
      });
    }
  }

  const judgeConfigured = value.judgeModelId !== undefined;
  if (
    judgeConfigured &&
    (value.judgeHost === undefined || value.judgeAdapterVersion === undefined)
  ) {
    context.addIssue({
      code: "custom",
      message: "configured judge reports require judgeHost and judgeAdapterVersion",
      path: ["judgeModelId"],
    });
  }
  if (!judgeConfigured && [
    value.judgeHost,
    value.judgeModel,
    value.judgeModelVersion,
    value.judgeAdapterVersion,
  ].some((item) => item !== undefined)) {
    context.addIssue({
      code: "custom",
      message: "judge identity requires judgeModelId",
      path: ["judgeModelId"],
    });
  }
  if (value.phase === "release" && value.metrics.frozen === undefined) {
    context.addIssue({
      code: "custom",
      message: "release reports require a frozen metric",
      path: ["metrics", "frozen"],
    });
  }
  if (value.phase === "evaluate" && value.metrics.frozen !== undefined) {
    context.addIssue({
      code: "custom",
      message: "evaluate reports must not contain a frozen metric",
      path: ["metrics", "frozen"],
    });
  }
  if (value.judgeModelId !== undefined && value.metrics.invalidRun.value === 0 &&
    (value.judgeHost === undefined || value.judgeModel === undefined ||
      value.judgeModelVersion === undefined || value.judgeAdapterVersion === undefined)) {
    context.addIssue({
      code: "custom",
      message: "valid judged reports require complete judge identity",
      path: ["judgeModelId"],
    });
  }
  if (value.targetSkillRevision === null && value.installedSkills.includes(value.targetSkill)) {
    context.addIssue({
      code: "custom",
      message: "an installed target skill requires targetSkillRevision",
      path: ["targetSkillRevision"],
    });
  }
  if (value.targetSkillRevision !== null && !value.installedSkills.includes(value.targetSkill)) {
    context.addIssue({
      code: "custom",
      message: "targetSkillRevision must be null when the target skill is omitted",
      path: ["targetSkillRevision"],
    });
  }
  if (value.targetSkillRevision === null && value.cost.targetSkillBytes !== 0) {
    context.addIssue({
      code: "custom",
      message: "no-skill reports require zero targetSkillBytes",
      path: ["cost", "targetSkillBytes"],
    });
  }
  if (value.targetSkillRevision !== null && value.cost.targetSkillBytes === 0) {
    context.addIssue({
      code: "custom",
      message: "installed target skills require non-zero targetSkillBytes",
      path: ["cost", "targetSkillBytes"],
    });
  }
});
export type AggregateReportType = z.infer<typeof AggregateReportSchema>;
