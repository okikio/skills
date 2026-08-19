import { z } from "zod";

/** Provider host families supported by the SkillOpt adapter registry. */
export const ModelHostSchema = z.enum([
  "codex",
  "claude",
  "cursor",
  "copilot",
  "pi",
  "hermes",
  "generic",
]);
export type ModelHostType = z.infer<typeof ModelHostSchema>;

/**
 * One external provider adapter available to target rollouts and/or judges.
 *
 * The command is a file-protocol adapter rather than a raw model CLI. Its
 * declared request kinds state exactly which normalized protocol messages the
 * adapter can consume. Environment access is an allowlist; secret names must
 * also be present in that allowlist so the evaluator can redact their values.
 */
export const ModelAdapterSchema = z.strictObject({
  id: z.string().min(1),
  host: ModelHostSchema,
  command: z.array(z.string()).min(1),
  requests: z.array(z.enum(["rollout", "judge"])).min(1),
  adapterVersion: z.string().default("unversioned"),
  enabled: z.boolean().default(false),
  env: z.array(z.string()).default([]),
  secretEnv: z.array(z.string()).default([]),
  timeoutMs: z.number().int().positive().max(3_600_000).default(600_000),
  notes: z.string().optional(),
}).superRefine((value, context) => {
  if (new Set(value.requests).size !== value.requests.length) {
    context.addIssue({
      code: "custom",
      message: "Model adapter request kinds must be unique",
      path: ["requests"],
    });
  }

  const command = value.command.join("\0");
  for (const placeholder of ["{request}", "{response}"]) {
    if (!command.includes(placeholder)) {
      context.addIssue({
        code: "custom",
        message: `Model adapter command requires ${placeholder}`,
        path: ["command"],
      });
    }
  }

  const passed = new Set(value.env);
  for (const name of value.secretEnv) {
    if (!passed.has(name)) {
      context.addIssue({
        code: "custom",
        message: `Secret environment variable ${name} must also be passed`,
        path: ["secretEnv"],
      });
    }
  }
});
export type ModelAdapterType = z.infer<typeof ModelAdapterSchema>;

/** Versioned collection of external provider adapter definitions. */
export const ModelRegistrySchema = z.strictObject({
  schemaVersion: z.literal(2),
  models: z.array(ModelAdapterSchema),
});
export type ModelRegistryType = z.infer<typeof ModelRegistrySchema>;
