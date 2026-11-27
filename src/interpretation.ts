import type { EvalCaseType } from "./corpus.ts";

/**
 * Render the original task with its explicit, versioned ownership interpretation.
 * Both providers consume this through their existing required prompt field, so
 * an adapter does not need to recognize an additional optional protocol field.
 * Only owner identities are added; rubric and assertion content stays private
 * from the target. Changing these version-1 semantics requires a new version.
 */
export function effectivePrompt(
  evaluation: Pick<EvalCaseType, "prompt" | "interpretation">,
): string {
  const interpretation = evaluation.interpretation;
  if (!interpretation) return evaluation.prompt;
  return evaluation.prompt + "\n\n" +
    "Case interpretation: skill-owner-migration, version 1.\n" +
    `For this case, responsibilities formerly attributed to ${interpretation.legacyOwner} ` +
    `now belong to ${interpretation.currentOwner}, applying the shared quality guidance. ` +
    "This changes ownership only; the original task requirements remain unchanged. " +
    "Use only the skills actually supplied for this run; a comparison baseline may omit its target.";
}
