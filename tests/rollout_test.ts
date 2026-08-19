import { expect } from "@std/expect";
import { describe, it } from "node:test";
import { EvalCaseSchema } from "../src/corpus.ts";
import * as rollout from "../src/rollout.ts";
import { ModelAdapterSchema } from "../src/model.ts";
import {
  JudgeRequestSchema,
  JudgeResponseSchema,
  RolloutRequestSchema,
  RolloutResponseSchema,
} from "../src/protocol.ts";

describe("SkillOpt provider protocol", () => {
  it("requires request and response file placeholders", () => {
    const parsed = ModelAdapterSchema.safeParse({
      id: "raw-cli",
      host: "generic",
      command: ["provider", "{prompt}"],
      requests: ["rollout"],
      adapterVersion: "2",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires secret environment names to be explicitly passed", () => {
    const parsed = ModelAdapterSchema.safeParse({
      id: "provider",
      host: "generic",
      command: ["adapter", "{request}", "{response}"],
      requests: ["rollout", "judge"],
      adapterVersion: "2",
      env: ["PATH"],
      secretEnv: ["API_KEY"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate request kinds", () => {
    const parsed = ModelAdapterSchema.safeParse({
      id: "provider",
      host: "generic",
      command: ["adapter", "{request}", "{response}"],
      requests: ["rollout", "rollout"],
      adapterVersion: "2",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates normalized rollout telemetry", () => {
    const request = RolloutRequestSchema.parse({
      schemaVersion: 1,
      kind: "rollout",
      runId: "run-1",
      caseId: "case-1",
      prompt: "Inspect the fixture and verify the requested behavior.",
      cwd: "/tmp/fixture",
      skillsRoot: "/tmp/skills",
      targetSkill: "deliver-software",
      installedSkills: [{
        id: "deliver-software",
        path: "/tmp/skills/skills/deliver-software",
        revision: "a".repeat(64),
        role: "target",
      }],
      seed: 7,
      repetition: 0,
    });
    const response = RolloutResponseSchema.parse({
      schemaVersion: 1,
      kind: "rollout",
      model: "model",
      modelVersion: "2026-08-19",
      adapterVersion: "2",
      output: "Verified.",
      activatedSkills: ["deliver-software"],
      referencesRead: ["deliver-software/references/base.md"],
      toolCalls: [{ name: "read", input: "README.md" }],
      commands: [{ command: ["deno", "task", "check"], exitCode: 0 }],
    });

    expect(request.installedSkills).toHaveLength(1);
    expect(response.activatedSkills).toEqual(["deliver-software"]);
    expect(response.toolCalls).toHaveLength(1);
    expect(response.commands).toHaveLength(1);
  });

  it("validates judge requests without exposing hidden evaluator state", () => {
    const request = JudgeRequestSchema.parse({
      schemaVersion: 1,
      kind: "judge",
      runId: "run-1",
      caseId: "case-1",
      prompt: "Review the target result against the supplied criteria.",
      criteria: [{ index: 0, criterion: "Explains the verified behavior." }],
      evidence: {
        output: "Verified.",
        activatedSkills: ["deliver-software"],
        referencesRead: ["deliver-software/references/base.md"],
        messages: [],
        toolCalls: [],
        commands: [],
        changedFiles: ["README.md"],
        assertionResults: [{ label: "contains:verified", passed: true }],
      },
      seed: 7,
      repetition: 0,
    });

    expect(request.kind).toBe("judge");
    expect(request.criteria).toEqual([
      { index: 0, criterion: "Explains the verified behavior." },
    ]);
    expect(Object.hasOwn(request, "cwd")).toBe(false);
    expect(Object.hasOwn(request, "skillsRoot")).toBe(false);
  });

  it("rejects duplicate qualitative result indexes", () => {
    const parsed = JudgeResponseSchema.safeParse({
      schemaVersion: 1,
      kind: "judge",
      model: "judge-model",
      modelVersion: "1",
      adapterVersion: "2",
      results: [
        { index: 0, passed: true, evidence: "Criterion satisfied." },
        { index: 0, passed: false, evidence: "Duplicate decision." },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it("requires a rubric for trajectory-rubric cases", () => {
    const parsed = EvalCaseSchema.safeParse({
      id: "judge-case",
      title: "Judge case",
      skill: "deliver-software",
      kind: "trajectory",
      split: "valid-seen",
      prompt: "Review this implementation and explain the result.",
      assertions: [{ kind: "contains", value: "result" }],
      rubric: [],
      oracleStrength: "trajectory-rubric",
      tags: ["judge"],
      rationale: "The case requires qualitative trajectory review.",
    });
    expect(parsed.success).toBe(false);
  });
  it("prepares a real empty skill installation for a no-skill baseline", async () => {
    const workspace = await Deno.makeTempDir();
    let prepared: string | undefined;
    try {
      prepared = await rollout.createSkills(workspace, undefined, []);
      const info = await Deno.stat(`${prepared}/skills`);
      expect(info.isDirectory).toBe(true);
      const entries = [];
      for await (const entry of Deno.readDir(`${prepared}/skills`)) entries.push(entry);
      expect(entries).toHaveLength(0);
    } finally {
      if (prepared) await Deno.remove(prepared, { recursive: true });
      await Deno.remove(workspace, { recursive: true });
    }
  });

});
