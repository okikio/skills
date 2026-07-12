import { z } from "zod";

export const SkillNameSchema = z.enum(["deliver-software", "deno-software", "composition"]);
export const EvalKindSchema = z.enum(["routing", "knowledge", "trajectory", "artifact", "composition", "safety"]);
export const EvalSplitSchema = z.enum(["train", "valid-seen", "valid-unseen", "transfer", "adversarial", "test-frozen"]);
export const AssertionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("contains"), value: z.string(), caseSensitive: z.boolean().default(false) }),
  z.object({ kind: z.literal("not-contains"), value: z.string(), caseSensitive: z.boolean().default(false) }),
  z.object({ kind: z.literal("regex"), value: z.string(), flags: z.string().default("i") }),
  z.object({ kind: z.literal("file-exists"), value: z.string() }),
  z.object({ kind: z.literal("file-not-exists"), value: z.string() }),
  z.object({ kind: z.literal("command"), command: z.array(z.string()).min(1), expectedExitCode: z.number().int().default(0) }),
]);
export const EvalCaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]+$/),
  title: z.string().min(3),
  skill: SkillNameSchema,
  kind: EvalKindSchema,
  split: EvalSplitSchema,
  prompt: z.string().min(8),
  fixture: z.string().optional(),
  shouldActivate: z.boolean().optional(),
  requiredReferences: z.array(z.string()).default([]),
  forbiddenReferences: z.array(z.string()).default([]),
  assertions: z.array(AssertionSchema).min(1),
  rubric: z.array(z.string()).default([]),
  tags: z.array(z.string()).min(1),
  rationale: z.string().min(8),
});
export type EvalCase = z.infer<typeof EvalCaseSchema>;
export const EvalCaseFileSchema = z.object({ schemaVersion: z.literal(1), cases: z.array(EvalCaseSchema).min(1) });
export const ModelAdapterSchema = z.object({
  id: z.string(),
  host: z.enum(["codex", "claude", "cursor", "copilot", "pi", "hermes", "generic"]),
  command: z.array(z.string()).min(1),
  enabled: z.boolean().default(false),
  env: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export const ModelRegistrySchema = z.object({ schemaVersion: z.literal(1), models: z.array(ModelAdapterSchema) });
export const EvalResultSchema = z.object({
  caseId: z.string(),
  modelId: z.string(),
  variant: z.enum(["no-skill", "deliver-software", "deno-software", "composed"]),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  durationMs: z.number().nonnegative(),
  outputCharacters: z.number().int().nonnegative(),
  assertionResults: z.array(z.object({ label: z.string(), passed: z.boolean(), evidence: z.string().optional() })),
  error: z.string().optional(),
});
export type EvalResult = z.infer<typeof EvalResultSchema>;

