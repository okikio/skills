import type { EvalCaseType } from "./corpus.ts";
import type { ReportCaseType } from "./report.ts";
import type { EvalResultType } from "./evaluation.ts";
import type {
  MeanType,
  MetricType,
  ReportCostType,
  ReportMetricsType,
  SelectionMetricType,
} from "./aggregate.ts";

/** Assertion kinds whose success means one prohibited outcome did not occur. */
const NEGATIVE_ASSERTION_KINDS = new Set([
  "not-contains",
  "file-not-exists",
  "file-unchanged",
]);

/** Return the arithmetic mean for one non-empty numeric set. */
function average(values: readonly number[]): number {
  if (values.length === 0) throw new Error("Cannot average an empty value set");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Return a normalized score/rate metric for one non-empty value set. */
function metric(values: readonly number[]): MetricType | undefined {
  return values.length === 0
    ? undefined
    : { value: average(values), samples: values.length };
}

/** Return a numeric mean while preserving the observation count. */
function mean(values: readonly number[]): MeanType | undefined {
  return values.length === 0
    ? undefined
    : { value: average(values), samples: values.length };
}

/** Compare exact expected values with observed values using micro averaging. */
function selection(
  pairs: readonly {
    readonly expected: readonly string[];
    readonly observed: readonly string[];
  }[],
): SelectionMetricType {
  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;

  for (const pair of pairs) {
    const expected = new Set(pair.expected);
    const observed = new Set(pair.observed);
    for (const value of observed) {
      if (expected.has(value)) truePositive++;
      else falsePositive++;
    }
    for (const value of expected) {
      if (!observed.has(value)) falseNegative++;
    }
  }

  const precisionDenominator = truePositive + falsePositive;
  const recallDenominator = truePositive + falseNegative;
  return {
    precision: precisionDenominator === 0
      ? 1
      : truePositive / precisionDenominator,
    recall: recallDenominator === 0 ? 1 : truePositive / recallDenominator,
    truePositive,
    falsePositive,
    falseNegative,
  };
}

/** Return results whose source case satisfies one exact predicate. */
function selectResults(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
  predicate: (item: EvalCaseType) => boolean,
): EvalResultType[] {
  return results.filter((result) => {
    const record = cases.get(result.caseId);
    if (!record) throw new Error(`Unknown report case: ${result.caseId}`);
    return predicate(record.item);
  });
}

/** Mean normalized result score for cases selected by `predicate`. */
function score(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
  predicate: (item: EvalCaseType) => boolean,
): MetricType | undefined {
  return metric(
    selectResults(results, cases, predicate).map((result) => result.score),
  );
}

/** Pass/fail rate for cases selected by `predicate`. */
function passRate(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
  predicate: (item: EvalCaseType) => boolean,
): MetricType | undefined {
  return metric(
    selectResults(results, cases, predicate).map((result) =>
      Number(result.passed)
    ),
  );
}

/** Failure rate for cases selected by `predicate`. */
function failureRate(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
  predicate: (item: EvalCaseType) => boolean,
): MetricType | undefined {
  return metric(
    selectResults(results, cases, predicate).map((result) =>
      Number(!result.passed)
    ),
  );
}

/**
 * Count explicit prohibited outcomes and the subset violated by one rollout.
 *
 * The denominator contains only authored negative expectations: forbidden skill
 * activations, forbidden reference reads, and negative deterministic assertions.
 * This avoids inventing a generic "bad action" detector from tool-call text.
 */
function prohibitedOutcome(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
): MetricType | undefined {
  let observations = 0;
  let violations = 0;

  for (const result of results) {
    const record = cases.get(result.caseId);
    if (!record) throw new Error(`Unknown report case: ${result.caseId}`);
    const item = record.item;
    const activated = new Set(result.activatedSkills);
    const references = new Set(result.referencesRead);

    observations += item.forbiddenSkills.length;
    violations += item.forbiddenSkills.filter((skill) => activated.has(skill))
      .length;
    observations += item.forbiddenReferences.length;
    violations += item.forbiddenReferences.filter((path) => references.has(path))
      .length;

    if (result.assertionResults.length !== item.assertions.length) {
      throw new Error(
        `${result.caseId}: result assertion count does not match the exported case`,
      );
    }
    item.assertions.forEach((assertion, index) => {
      if (!NEGATIVE_ASSERTION_KINDS.has(assertion.kind)) return;
      observations++;
      if (!result.assertionResults[index]?.passed) violations++;
    });
  }

  return observations === 0
    ? undefined
    : { value: violations / observations, samples: observations };
}

/** Derive normalized benchmark-quality metrics from exact case/result pairs. */
export function getMetrics(
  results: readonly EvalResultType[],
  cases: ReadonlyMap<string, ReportCaseType>,
): ReportMetricsType {
  const taskSuccess = metric(results.map((result) => Number(result.passed)))!;
  const invalidRun = metric(
    results.map((result) => Number(result.error !== undefined)),
  )!;
  const validUnseen = score(
    results,
    cases,
    (item) => item.split === "valid-unseen",
  );
  if (!validUnseen) throw new Error("Report requires at least one valid-unseen case");

  return {
    taskSuccess,
    invalidRun,
    validUnseen,
    transfer: score(results, cases, (item) => item.split === "transfer"),
    adversarial: score(results, cases, (item) => item.split === "adversarial"),
    composition: score(results, cases, (item) => item.kind === "composition"),
    safety: score(results, cases, (item) => item.kind === "safety"),
    frozen: score(results, cases, (item) => item.split === "test-frozen"),
    artifact: score(results, cases, (item) => item.kind === "artifact"),
    fixture: passRate(results, cases, (item) => item.fixture !== undefined),
    activation: selection(results.map((result) => ({
      expected: cases.get(result.caseId)!.item.expectedSkills,
      observed: result.activatedSkills,
    }))),
    references: selection(results.map((result) => ({
      expected: cases.get(result.caseId)!.item.requiredReferences,
      observed: result.referencesRead,
    }))),
    prohibitedOutcome: prohibitedOutcome(results, cases),
    hallucination: failureRate(
      results,
      cases,
      (item) => item.tags.includes("anti-hallucination"),
    ),
    markdownPreservation: passRate(
      results,
      cases,
      (item) => item.tags.includes("markdown"),
    ),
    verification: passRate(
      results,
      cases,
      (item) => item.tags.includes("verification"),
    ),
  };
}

/** Derive target/judge/runtime cost measurements without mixing their units. */
export function getCost(
  results: readonly EvalResultType[],
  targetSkillBytes: number,
): ReportCostType {
  return {
    targetDurationMs: mean(results.map((result) => result.durationMs))!,
    judgeDurationMs: mean(results.flatMap((result) =>
      result.judgeDurationMs === undefined ? [] : [result.judgeDurationMs]
    )),
    toolCalls: mean(results.map((result) => result.toolCalls))!,
    commands: mean(results.map((result) => result.commands))!,
    outputCharacters: mean(results.map((result) => result.outputCharacters))!,
    inputTokens: mean(results.flatMap((result) =>
      result.inputTokens === undefined ? [] : [result.inputTokens]
    )),
    outputTokens: mean(results.flatMap((result) =>
      result.outputTokens === undefined ? [] : [result.outputTokens]
    )),
    judgeInputTokens: mean(results.flatMap((result) =>
      result.judgeInputTokens === undefined ? [] : [result.judgeInputTokens]
    )),
    judgeOutputTokens: mean(results.flatMap((result) =>
      result.judgeOutputTokens === undefined ? [] : [result.judgeOutputTokens]
    )),
    changedFiles: mean(results.map((result) => result.changedFiles.length))!,
    addedLines: mean(results.map((result) => result.addedLines))!,
    deletedLines: mean(results.map((result) => result.deletedLines))!,
    targetSkillBytes,
  };
}
