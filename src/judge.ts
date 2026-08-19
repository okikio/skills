import type { ModelAdapterType } from "./model.ts";
import * as provider from "./provider.ts";
import {
  JudgeRequestSchema,
  type JudgeResponseType,
  type RolloutResponseType,
} from "./protocol.ts";
import { redactValue } from "./redact.ts";
import type {
  AssertionResultType,
  RubricResultType,
} from "./evaluation.ts";

/** Inputs required to run or deliberately skip one qualitative judge. */
export interface EvaluateOptionsType {
  /** Configured judge provider adapter. */
  readonly model: ModelAdapterType;
  /** Target rollout identity shared with the qualitative result. */
  readonly runId: string;
  readonly caseId: string;
  /** Original task prompt evaluated against the source rubric. */
  readonly prompt: string;
  /** Source rubric criteria, in stable source order. */
  readonly rubric: readonly string[];
  /** Normalized target evidence after provider response validation. */
  readonly response: RolloutResponseType;
  /** Deterministic fixture-relative paths changed by the target. */
  readonly changedFiles: readonly string[];
  /** Deterministic assertion outcomes computed before judge invocation. */
  readonly assertionResults: readonly AssertionResultType[];
  /** Target-provider secrets that must be removed before judging. */
  readonly secrets: Readonly<Record<string, string | undefined>>;
  /** Provider protocol directory, also used as judge working directory. */
  readonly protocolRoot: string;
  readonly seed: number;
  readonly repetition: number;
  /** Existing target/provider fault. A fault skips qualitative judging. */
  readonly targetError?: string;
}

/** Qualitative evaluation returned to the repository rollout composition. */
export interface EvaluationType {
  readonly results: RubricResultType[];
  readonly call?: provider.CallType<JudgeResponseType>;
  readonly secrets: Readonly<Record<string, string | undefined>>;
  readonly error?: string;
}

/** Produce an explicit failure for every criterion when judging cannot proceed. */
function fail(
  rubric: readonly string[],
  evidence: string,
): RubricResultType[] {
  return rubric.map((_, index) => ({ index, passed: false, evidence }));
}

/** Check that a judge returned exactly one decision for every criterion index. */
function complete(
  results: readonly RubricResultType[],
  count: number,
): string | undefined {
  const expected = Array.from({ length: count }, (_, index) => index);
  const actual = results.map((result) => result.index).sort((a, b) => a - b);
  if (
    actual.length === expected.length &&
    expected.every((index, position) => actual[position] === index)
  ) return undefined;

  return `Judge returned rubric indexes [${actual.join(", ")}] but expected [${expected.join(", ")}]`;
}

/**
 * Evaluate the qualitative rubric without exposing hidden evaluator resources.
 *
 * Target-provider secrets are removed from structured trajectory fields before
 * request serialization. The judge runs from the protocol directory and never
 * receives the fixture root, baseline root, or skill installation root. A bad
 * target rollout skips judging instead of spending tokens on untrusted evidence.
 */
export async function evaluate(
  options: EvaluateOptionsType,
): Promise<EvaluationType> {
  if (options.targetError) {
    const detail =
      `Judge skipped because the target rollout is invalid: ${options.targetError}`;
    return {
      results: fail(options.rubric, detail),
      secrets: {},
    };
  }

  const request = JudgeRequestSchema.parse({
    schemaVersion: 1,
    kind: "judge",
    runId: options.runId,
    caseId: options.caseId,
    prompt: options.prompt,
    criteria: options.rubric.map((criterion, index) => ({ index, criterion })),
    evidence: redactValue({
      output: options.response.output,
      activatedSkills: options.response.activatedSkills,
      referencesRead: options.response.referencesRead,
      messages: options.response.messages,
      toolCalls: options.response.toolCalls,
      commands: options.response.commands,
      changedFiles: options.changedFiles,
      assertionResults: options.assertionResults,
    }, options.secrets),
    seed: options.seed,
    repetition: options.repetition,
  });

  const call = await provider.call(
    options.model,
    request,
    options.protocolRoot,
    options.protocolRoot,
  );
  if (call.error || !call.response) {
    const detail = call.error ?? "Judge returned no normalized response";
    return {
      results: fail(options.rubric, `Judge failed: ${detail}`),
      call,
      secrets: call.secrets,
      error: `Judge failed: ${detail}`,
    };
  }

  const completenessError = complete(call.response.results, options.rubric.length);
  if (completenessError) {
    return {
      results: fail(options.rubric, completenessError),
      call,
      secrets: call.secrets,
      error: completenessError,
    };
  }

  return {
    results: [...call.response.results].sort((left, right) =>
      left.index - right.index
    ),
    call,
    secrets: call.secrets,
  };
}
