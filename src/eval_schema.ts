import { z } from "zod";

export const SkillIdSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
export const EvalTargetSchema = z.union([
  SkillIdSchema,
  z.literal("composition"),
]);
// Retained as a source-compatible alias for callers of the first schema.
export const SkillNameSchema = EvalTargetSchema;

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

export const SourceRecordSchema = z.object({
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
export const SourceRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(SourceRecordSchema),
});

export const CapabilityRecordSchema = z.object({
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
export const CapabilityRegistrySchema = z.object({
  schemaVersion: z.literal(1),
  capabilities: z.array(CapabilityRecordSchema).min(1),
});
export type CapabilityRecord = z.infer<typeof CapabilityRecordSchema>;

export const AssertionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("contains"),
    value: z.string(),
    caseSensitive: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal("not-contains"),
    value: z.string(),
    caseSensitive: z.boolean().default(false),
  }),
  z.object({
    kind: z.literal("regex"),
    value: z.string(),
    flags: z.string().default("i"),
  }),
  z.object({ kind: z.literal("file-exists"), value: z.string() }),
  z.object({ kind: z.literal("file-not-exists"), value: z.string() }),
  z.object({
    kind: z.literal("file-unchanged"),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("file-changed"),
    value: z.string(),
  }),
  z.object({
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

const LegacyActivationSchema = z.object({
  deliverSoftware: z.boolean(),
  denoSoftware: z.boolean(),
});

export const EvalCaseSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]+$/),
  title: z.string().min(3),
  skill: EvalTargetSchema,
  kind: EvalKindSchema,
  split: EvalSplitSchema,
  prompt: z.string().min(8),
  fixture: z.string().optional(),
  shouldActivate: z.boolean().optional(),
  // `activation` accepts the first-generation shape while cases migrate to the
  // generic expected/forbidden skill arrays.
  activation: LegacyActivationSchema.optional(),
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
export type EvalCase = z.infer<typeof EvalCaseSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;

export const EvalCaseFileSchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  cases: z.array(EvalCaseSchema).min(1),
});

export const ModelAdapterSchema = z.object({
  id: z.string(),
  host: z.enum([
    "codex",
    "claude",
    "cursor",
    "copilot",
    "pi",
    "hermes",
    "generic",
  ]),
  command: z.array(z.string()).min(1),
  adapterVersion: z.string().default("unversioned"),
  enabled: z.boolean().default(false),
  env: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export const ModelRegistrySchema = z.object({
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  models: z.array(ModelAdapterSchema),
});

export const AssertionResultSchema = z.object({
  label: z.string(),
  passed: z.boolean(),
  evidence: z.string().optional(),
});

export const EvalResultSchema = z.object({
  schemaVersion: z.literal(2),
  runId: z.string(),
  caseId: z.string(),
  caseDigest: z.string(),
  corpusDigest: z.string(),
  modelId: z.string(),
  host: ModelAdapterSchema.shape.host,
  model: z.string(),
  modelVersion: z.string().default("unreported"),
  adapterVersion: z.string(),
  variantId: z.string(),
  targetSkill: SkillIdSchema.optional(),
  installedSkills: z.array(SkillIdSchema),
  activatedSkills: z.array(SkillIdSchema),
  skillRevisions: z.record(SkillIdSchema, z.string()),
  seed: z.number().int(),
  repetition: z.number().int().nonnegative(),
  passed: z.boolean(),
  score: z.number().min(0).max(1),
  durationMs: z.number().nonnegative(),
  outputCharacters: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  toolCalls: z.number().int().nonnegative(),
  commands: z.number().int().nonnegative(),
  referencesRead: z.array(z.string()),
  changedFiles: z.array(z.string()),
  addedLines: z.number().int().nonnegative(),
  deletedLines: z.number().int().nonnegative(),
  fixtureDigestBefore: z.string().optional(),
  fixtureDigestAfter: z.string().optional(),
  assertionResults: z.array(AssertionResultSchema),
  rubricResults: z.array(AssertionResultSchema).default([]),
  error: z.string().optional(),
});
export type EvalResult = z.infer<typeof EvalResultSchema>;

export const AggregateReportSchema = z.object({
  schemaVersion: z.literal(3),
  phase: z.enum(["evaluate", "release"]),
  runId: z.string(),
  createdAt: z.iso.datetime(),
  gitRevision: z.string(),
  benchmarkId: z.string(),
  skillRevision: z.string(),
  targetSkill: SkillIdSchema,
  host: ModelAdapterSchema.shape.host,
  model: z.string(),
  modelVersion: z.string(),
  adapterVersion: z.string(),
  variantRole: z.enum(["baseline", "candidate"]),
  variantId: z.string(),
  installedSkills: z.array(SkillIdSchema),
  caseSetDigest: z.string(),
  caseIds: z.array(z.string()).min(1),
  seedPolicy: z.string(),
  repetitions: z.number().int().positive(),
  runCount: z.number().int().positive(),
  taskSuccessRate: z.number().min(0).max(1),
  validUnseenScore: z.number().min(0).max(1),
  adversarialScore: z.number().min(0).max(1),
  compositionScore: z.number().min(0).max(1),
  safetyScore: z.number().min(0).max(1),
  frozenScore: z.number().min(0).max(1).optional(),
  artifactScore: z.number().min(0).max(1),
  fixturePassRate: z.number().min(0).max(1),
  activationPrecision: z.number().min(0).max(1),
  activationRecall: z.number().min(0).max(1),
  referencePrecision: z.number().min(0).max(1),
  referenceRecall: z.number().min(0).max(1),
  forbiddenActionRate: z.number().min(0).max(1),
  hallucinationRate: z.number().min(0).max(1),
  markdownPreservationRate: z.number().min(0).max(1),
  verificationRate: z.number().min(0).max(1),
  meanDurationMs: z.number().nonnegative(),
  meanToolCalls: z.number().nonnegative(),
  meanInputTokens: z.number().nonnegative().optional(),
  meanOutputTokens: z.number().nonnegative().optional(),
  skillTokens: z.number().int().positive(),
}).superRefine((value, context) => {
  if (value.phase === "release" && value.frozenScore === undefined) {
    context.addIssue({
      code: "custom",
      message: "release reports require frozenScore",
      path: ["frozenScore"],
    });
  }
  if (value.phase === "evaluate" && value.frozenScore !== undefined) {
    context.addIssue({
      code: "custom",
      message: "evaluate reports must not include frozenScore",
      path: ["frozenScore"],
    });
  }
});
export type AggregateReport = z.infer<typeof AggregateReportSchema>;

export const SkillOptWorkspaceSchema = z.object({
  schemaVersion: z.literal(2),
  mode: z.enum(["optimize", "evaluate", "release"]),
  optimizationUnit: z.enum(["root-router", "reference"]),
  targetSkill: SkillIdSchema,
  targetReference: z.string().optional(),
  companionSkills: z.array(SkillIdSchema),
  mutablePaths: z.array(z.string()),
  immutablePaths: z.array(z.string()),
  immutableDigests: z.record(
    z.string(),
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  skillRevisions: z.record(
    SkillIdSchema,
    z.string().regex(/^[a-f0-9]{64}$/),
  ),
  cases: z.array(z.object({
    id: z.string(),
    digest: z.string().regex(/^[a-f0-9]{64}$/),
  })),
  caseSetDigest: z.string().regex(/^[a-f0-9]{64}$/),
}).superRefine((value, context) => {
  if (value.mode === "optimize" && value.mutablePaths.length !== 1) {
    context.addIssue({
      code: "custom",
      message: "optimize workspaces require exactly one mutable path",
      path: ["mutablePaths"],
    });
  }
  if (value.mode !== "optimize" && value.mutablePaths.length !== 0) {
    context.addIssue({
      code: "custom",
      message: "evaluation and release workspaces must be immutable",
      path: ["mutablePaths"],
    });
  }
  if (value.optimizationUnit === "reference" && !value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "reference optimization requires targetReference",
      path: ["targetReference"],
    });
  }
  if (value.optimizationUnit === "root-router" && value.targetReference) {
    context.addIssue({
      code: "custom",
      message: "root-router optimization cannot set targetReference",
      path: ["targetReference"],
    });
  }
});
export type SkillOptWorkspace = z.infer<typeof SkillOptWorkspaceSchema>;
