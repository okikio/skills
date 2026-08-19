import { z } from "zod";
import { SkillIdSchema } from "./corpus.ts";
import { ModelHostSchema } from "./model.ts";

/** Deterministic outcome produced by one repository-owned assertion. */
export const AssertionResultSchema = z.strictObject({
  /** Stable assertion label used in traces and human review. */
  label: z.string(),
  /** Whether the deterministic acceptance check succeeded. */
  passed: z.boolean(),
  /** Optional concrete observation explaining the result. */
  evidence: z.string().optional(),
});
export type AssertionResultType = z.infer<typeof AssertionResultSchema>;

/** One qualitative judge decision tied to a source rubric index. */
export const RubricResultSchema = z.strictObject({
  /** Stable zero-based rubric index from the source evaluation case. */
  index: z.number().int().nonnegative(),
  /** Whether the supplied target evidence satisfies this criterion. */
  passed: z.boolean(),
  /** Concrete explanation supporting the judge decision. */
  evidence: z.string().min(1),
});
export type RubricResultType = z.infer<typeof RubricResultSchema>;

/**
 * Normalized result for one target rollout and its optional qualitative judge.
 *
 * Target and judge identity/cost remain separate. This prevents judging work
 * from being confused with target-model latency or token use and lets aggregate
 * gates prove that baseline and candidate runs used the same grader.
 */
export const EvalResultSchema = z.strictObject({
  schemaVersion: z.literal(2),
  runId: z.string(),
  caseId: z.string(),
  caseDigest: z.string().regex(/^[a-f0-9]{64}$/),
  corpusDigest: z.string().regex(/^[a-f0-9]{64}$/),
  modelId: z.string(),
  host: ModelHostSchema,
  model: z.string(),
  modelVersion: z.string().default("unreported"),
  adapterVersion: z.string(),
  judgeModelId: z.string().optional(),
  judgeHost: ModelHostSchema.optional(),
  judgeModel: z.string().optional(),
  judgeModelVersion: z.string().optional(),
  judgeAdapterVersion: z.string().optional(),
  judgeDurationMs: z.number().nonnegative().optional(),
  variantId: z.string(),
  targetSkill: SkillIdSchema.optional(),
  installedSkills: z.array(SkillIdSchema),
  activatedSkills: z.array(SkillIdSchema),
  skillRevisions: z.record(
    SkillIdSchema,
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  seed: z.number().int(),
  repetition: z.number().int().nonnegative(),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  durationMs: z.number().nonnegative(),
  outputCharacters: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  judgeInputTokens: z.number().int().nonnegative().optional(),
  judgeOutputTokens: z.number().int().nonnegative().optional(),
  toolCalls: z.number().int().nonnegative(),
  commands: z.number().int().nonnegative(),
  referencesRead: z.array(z.string()),
  changedFiles: z.array(z.string()),
  addedLines: z.number().int().nonnegative(),
  deletedLines: z.number().int().nonnegative(),
  fixtureDigestBefore: z.string().optional(),
  fixtureDigestAfter: z.string().optional(),
  assertionResults: z.array(AssertionResultSchema),
  rubricResults: z.array(RubricResultSchema).default([]),
  error: z.string().optional(),
}).superRefine((value, context) => {
  const judgeConfigured = value.judgeModelId !== undefined;
  if (
    judgeConfigured &&
    (value.judgeHost === undefined || value.judgeAdapterVersion === undefined)
  ) {
    context.addIssue({
      code: "custom",
      message: "configured judge results require judgeHost and judgeAdapterVersion",
      path: ["judgeModelId"],
    });
  }
  if (!judgeConfigured && [
    value.judgeHost,
    value.judgeModel,
    value.judgeModelVersion,
    value.judgeAdapterVersion,
    value.judgeDurationMs,
    value.judgeInputTokens,
    value.judgeOutputTokens,
  ].some((item) => item !== undefined)) {
    context.addIssue({
      code: "custom",
      message: "judge telemetry requires judgeModelId",
      path: ["judgeModelId"],
    });
  }
});
export type EvalResultType = z.infer<typeof EvalResultSchema>;
