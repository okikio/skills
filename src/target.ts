import { isAbsolute, join, relative, resolve } from "node:path";
import type { RolloutResponseType } from "./protocol.ts";
import * as tree from "./tree.ts";

/** Inputs required to verify target telemetry and protected skill/baseline state. */
export interface CheckOptionsType {
  /** Normalized response returned by the target provider adapter. */
  readonly response: RolloutResponseType;
  /** Skill identifiers installed for this target rollout. */
  readonly installedSkills: readonly string[];
  /** Disposable root containing the exact installed skill copies. */
  readonly skillsRoot: string;
  /** Pre-rollout SHA-256 tree digest for each installed skill. */
  readonly skillRevisions: Readonly<Record<string, string>>;
  /** Hidden fixture baseline that the target must never mutate. */
  readonly baselineRoot: string;
  /** Pre-rollout digest for the complete hidden fixture baseline. */
  readonly baselineDigest: string;
}

/** Return reported references that do not name real installed Markdown files. */
async function getInvalidReferences(
  references: readonly string[],
  installed: ReadonlySet<string>,
  skillsRoot: string,
): Promise<string[]> {
  const invalid: string[] = [];
  const root = resolve(skillsRoot, "skills");

  for (const reference of references) {
    const [skill, first, ...rest] = reference.split("/");
    if (
      !skill || !installed.has(skill) || first !== "references" ||
      rest.length === 0 || !reference.endsWith(".md") ||
      rest.includes("..") || isAbsolute(reference)
    ) {
      invalid.push(reference);
      continue;
    }

    const path = resolve(root, reference);
    const relation = relative(root, path);
    if (isAbsolute(relation) || relation.startsWith("..")) {
      invalid.push(reference);
      continue;
    }
    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) invalid.push(reference);
    } catch {
      invalid.push(reference);
    }
  }

  return invalid;
}

/**
 * Verify provider telemetry and resources the target model must not mutate.
 *
 * This check deliberately validates reported reference paths against the real
 * disposable skill tree. A provider cannot earn reference-efficiency credit by
 * reporting a plausible path that was never supplied. Installed skill digests
 * and the hidden fixture baseline are checked independently after the model
 * exits so provider sandbox mistakes become explicit evaluation failures.
 */
export async function check(options: CheckOptionsType): Promise<string[]> {
  const errors: string[] = [];
  const installed = new Set(options.installedSkills);

  const unknownSkills = options.response.activatedSkills.filter((skill) =>
    !installed.has(skill)
  );
  if (unknownSkills.length > 0) {
    errors.push(
      `Adapter reported uninstalled skills: ${unknownSkills.join(", ")}`,
    );
  }

  const invalidReferences = await getInvalidReferences(
    options.response.referencesRead,
    installed,
    options.skillsRoot,
  );
  if (invalidReferences.length > 0) {
    errors.push(
      `Adapter reported invalid references: ${invalidReferences.join(", ")}`,
    );
  }

  for (const skill of options.installedSkills) {
    try {
      const current = await tree.getDigest(
        join(options.skillsRoot, "skills", skill),
      );
      if (current !== options.skillRevisions[skill]) {
        errors.push(`Rollout modified installed skill ${skill}`);
      }
    } catch (cause) {
      errors.push(`Cannot verify installed skill ${skill}: ${cause}`);
    }
  }

  try {
    const baseline = await tree.digest(await tree.snapshot(options.baselineRoot));
    if (baseline !== options.baselineDigest) {
      errors.push("Rollout modified the hidden fixture baseline");
    }
  } catch (cause) {
    errors.push(`Cannot verify hidden fixture baseline: ${cause}`);
  }

  return errors;
}
