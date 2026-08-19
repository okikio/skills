import { z } from "zod";
import { SkillIdSchema } from "./corpus.ts";
import {
  AssertionResultSchema,
  RubricResultSchema,
} from "./evaluation.ts";

/** One installed skill exposed to a target provider adapter. */
export const RolloutSkillSchema = z.strictObject({
  id: SkillIdSchema,
  path: z.string().min(1),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  role: z.enum(["target", "companion"]),
});
export type RolloutSkillType = z.infer<typeof RolloutSkillSchema>;

/**
 * Request passed to one external target-model adapter.
 *
 * Assertions and rubrics are deliberately absent so the target model cannot
 * optimize directly against evaluator internals.
 */
export const RolloutRequestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("rollout"),
  runId: z.string().min(1),
  caseId: z.string().min(1),
  prompt: z.string().min(8),
  cwd: z.string().min(1),
  skillsRoot: z.string().min(1),
  targetSkill: SkillIdSchema.optional(),
  installedSkills: z.array(RolloutSkillSchema),
  seed: z.number().int(),
  repetition: z.number().int().nonnegative(),
});
export type RolloutRequestType = z.infer<typeof RolloutRequestSchema>;

/** One normalized model message retained for trajectory review. */
export const RolloutMessageSchema = z.strictObject({
  role: z.string().min(1),
  text: z.string(),
});
export type RolloutMessageType = z.infer<typeof RolloutMessageSchema>;

/** One normalized provider-observed tool call. */
export const RolloutToolCallSchema = z.strictObject({
  name: z.string().min(1),
  input: z.string().optional(),
  output: z.string().optional(),
  error: z.string().optional(),
});
export type RolloutToolCallType = z.infer<typeof RolloutToolCallSchema>;

/** One normalized provider-observed shell/process command. */
export const RolloutCommandSchema = z.strictObject({
  command: z.array(z.string()).min(1),
  exitCode: z.number().int().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
});
export type RolloutCommandType = z.infer<typeof RolloutCommandSchema>;

/** Normalized evidence returned by a provider-specific target adapter. */
export const RolloutResponseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("rollout"),
  model: z.string().min(1),
  modelVersion: z.string().default("unreported"),
  adapterVersion: z.string().min(1),
  output: z.string(),
  activatedSkills: z.array(SkillIdSchema).default([]),
  referencesRead: z.array(z.string()).default([]),
  messages: z.array(RolloutMessageSchema).default([]),
  toolCalls: z.array(RolloutToolCallSchema).default([]),
  commands: z.array(RolloutCommandSchema).default([]),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});
export type RolloutResponseType = z.infer<typeof RolloutResponseSchema>;

/** One qualitative criterion exposed only to the judge adapter. */
export const JudgeCriterionSchema = z.strictObject({
  /** Stable zero-based index matching the source evaluation rubric. */
  index: z.number().int().nonnegative(),
  /** Human-readable criterion the judge must evaluate independently. */
  criterion: z.string().min(1),
});
export type JudgeCriterionType = z.infer<typeof JudgeCriterionSchema>;

/** Deterministic target evidence supplied after repository secret redaction. */
export const JudgeEvidenceSchema = z.strictObject({
  /** Final target-model answer after repository secret redaction. */
  output: z.string(),
  /** Skills the provider reported as actually activated. */
  activatedSkills: z.array(SkillIdSchema),
  /** Skill references the provider reported as actually read. */
  referencesRead: z.array(z.string()),
  /** Provider-observed model messages retained for trajectory review. */
  messages: z.array(RolloutMessageSchema),
  /** Provider-observed tool calls retained for trajectory review. */
  toolCalls: z.array(RolloutToolCallSchema),
  /** Provider-observed commands retained for verification review. */
  commands: z.array(RolloutCommandSchema),
  /** Sorted fixture-relative paths changed by the target rollout. */
  changedFiles: z.array(z.string()),
  /** Deterministic assertion outcomes computed before judging starts. */
  assertionResults: z.array(AssertionResultSchema),
});
export type JudgeEvidenceType = z.infer<typeof JudgeEvidenceSchema>;

/**
 * Request passed to a qualitative judge after deterministic target checks.
 *
 * The request excludes fixture paths, hidden baselines, skill installation
 * paths, and provider credentials. It carries only redacted evidence needed to
 * decide the source rubric.
 */
export const JudgeRequestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("judge"),
  runId: z.string().min(1),
  caseId: z.string().min(1),
  prompt: z.string().min(8),
  criteria: z.array(JudgeCriterionSchema).min(1),
  evidence: JudgeEvidenceSchema,
  seed: z.number().int(),
  repetition: z.number().int().nonnegative(),
});
export type JudgeRequestType = z.infer<typeof JudgeRequestSchema>;

/** Normalized qualitative result returned by one provider-specific judge. */
export const JudgeResponseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("judge"),
  model: z.string().min(1),
  modelVersion: z.string().default("unreported"),
  adapterVersion: z.string().min(1),
  results: z.array(RubricResultSchema).min(1),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
}).superRefine((value, context) => {
  const seen = new Set<number>();
  for (const result of value.results) {
    if (seen.has(result.index)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate rubric result index ${result.index}`,
        path: ["results"],
      });
    }
    seen.add(result.index);
  }
});
export type JudgeResponseType = z.infer<typeof JudgeResponseSchema>;
