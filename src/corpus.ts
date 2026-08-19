import { z } from "zod";

export const SkillIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
export const EvalTargetSchema = z.union([
  SkillIdSchema,
  z.literal("composition"),
]);
export const EvalKindSchema = z.enum([
  "routing",
  "knowledge",
  "trajectory",
  "artifact",
  "composition",
  "safety",
]);
export const EvalSplitSchema = z.enum([
  "train",
  "valid-seen",
  "valid-unseen",
  "transfer",
  "adversarial",
  "test-frozen",
]);
export const OracleStrengthSchema = z.enum([
  "routing-smoke",
  "deterministic-output",
  "fixture-behavior",
  "trajectory-rubric",
  "mixed",
]);
export const EvidenceStatusSchema = z.enum([
  "normative",
  "observed-source",
  "executable",
  "experimental",
  "counterexample",
  "inferred",
  "unresolved",
]);

export const SourceRecordSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  artifact: z.string(),
  kind: z.enum(["guidebook", "handoff", "codebase", "official-docs", "memory"]),
  status: EvidenceStatusSchema,
  role: z.string(),
  verifiedDate: z.iso.date(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  claimPaths: z.array(z.string()).default([]),
  duplicateOf: z.string().optional(),
  notes: z.string().optional(),
});
export const SourceRegistrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  sources: z.array(SourceRecordSchema),
});

export const CapabilityRecordSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  skill: SkillIdSchema,
  reference: z.string().regex(/^references\/[a-z0-9][a-z0-9._/-]*\.md$/),
  capability: z.string().min(8),
  ownership: z.string().min(8),
  status: EvidenceStatusSchema,
  sourceIds: z.array(z.string()).min(1),
  evalIds: z.array(z.string()).min(1),
  decisionQuestions: z.array(z.string().min(8)).min(1),
  failureSignatures: z.array(z.string().min(8)).min(1),
  exclusions: z.array(z.string().min(8)).min(1),
  verification: z.array(z.string().min(8)).min(1),
});
export const CapabilityRegistrySchema = z.strictObject({
  schemaVersion: z.literal(1),
  capabilities: z.array(CapabilityRecordSchema).min(1),
});
export type CapabilityRecordType = z.infer<typeof CapabilityRecordSchema>;

export const AssertionSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("contains"),
    value: z.string(),
    caseSensitive: z.boolean().default(false),
  }),
  z.strictObject({
    kind: z.literal("not-contains"),
    value: z.string(),
    caseSensitive: z.boolean().default(false),
  }),
  z.strictObject({
    kind: z.literal("regex"),
    value: z.string(),
    flags: z.string().default("i"),
  }),
  z.strictObject({ kind: z.literal("file-exists"), value: z.string() }),
  z.strictObject({ kind: z.literal("file-not-exists"), value: z.string() }),
  z.strictObject({
    kind: z.literal("file-unchanged"),
    value: z.string(),
  }),
  z.strictObject({
    kind: z.literal("file-changed"),
    value: z.string(),
  }),
  z.strictObject({
    kind: z.literal("command"),
    command: z.array(z.string()).min(1),
    expectedExitCode: z.number().int().default(0),
    stdout: z.string().optional(),
    stderr: z.string().optional(),
    timeoutMs: z.number().int().positive().max(300_000).default(120_000),
  }),
]);

const executableAssertionKinds = new Set([
  "file-exists",
  "file-not-exists",
  "file-unchanged",
  "file-changed",
  "command",
]);

export const EvalCaseSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]+$/),
  title: z.string().min(3),
  skill: EvalTargetSchema,
  kind: EvalKindSchema,
  split: EvalSplitSchema,
  prompt: z.string().min(8),
  fixture: z.string().optional(),
  expectedSkills: z.array(SkillIdSchema).default([]),
  forbiddenSkills: z.array(SkillIdSchema).default([]),
  requiredReferences: z.array(z.string()).default([]),
  forbiddenReferences: z.array(z.string()).default([]),
  assertions: z.array(AssertionSchema).min(1),
  rubric: z.array(z.string()).default([]),
  oracleStrength: OracleStrengthSchema.default("routing-smoke"),
  sourceIds: z.array(z.string()).default([]),
  evidenceStatus: EvidenceStatusSchema.default("unresolved"),
  tags: z.array(z.string()).min(1),
  rationale: z.string().min(8),
}).superRefine((value, context) => {
  const expected = new Set(value.expectedSkills);
  for (const skill of value.forbiddenSkills) {
    if (expected.has(skill)) {
      context.addIssue({
        code: "custom",
        message: `Skill ${skill} cannot be both expected and forbidden`,
        path: ["forbiddenSkills"],
      });
    }
  }
  if (value.oracleStrength === "fixture-behavior" && !value.fixture) {
    context.addIssue({
      code: "custom",
      message: "fixture-behavior cases require a fixture",
      path: ["fixture"],
    });
  }
  if (value.skill === "composition" && value.expectedSkills.length === 0) {
    context.addIssue({
      code: "custom",
      message: "composition cases require explicit expectedSkills",
      path: ["expectedSkills"],
    });
  }
  const hasExecutableAssertion = value.assertions.some((assertion) =>
    executableAssertionKinds.has(assertion.kind)
  );
  if (
    value.oracleStrength === "fixture-behavior" &&
    !hasExecutableAssertion
  ) {
    context.addIssue({
      code: "custom",
      message: "fixture-behavior cases require a command or file assertion",
      path: ["assertions"],
    });
  }
  if (
    value.oracleStrength === "trajectory-rubric" && value.rubric.length === 0
  ) {
    context.addIssue({
      code: "custom",
      message: "trajectory-rubric cases require at least one rubric criterion",
      path: ["rubric"],
    });
  }
  if (
    value.oracleStrength === "mixed" &&
    (!hasExecutableAssertion || value.rubric.length === 0)
  ) {
    context.addIssue({
      code: "custom",
      message: "mixed cases require both an executable assertion and a rubric",
      path: ["oracleStrength"],
    });
  }
});
export type EvalCaseType = z.infer<typeof EvalCaseSchema>;
export type AssertionType = z.infer<typeof AssertionSchema>;

export const EvalCaseFileSchema = z.strictObject({
  schemaVersion: z.literal(2),
  cases: z.array(EvalCaseSchema).min(1),
});
