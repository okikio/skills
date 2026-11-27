import { isAbsolute, relative, resolve, sep } from "node:path";
import { z } from "zod";

/** Portable skill identity shared by metadata, cases and installed paths. */
export const SkillIdSchema = z.string().min(1).max(64).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
);

/**
 * A normalized, repository-relative file name. URL fragments and percent escapes
 * are resolved before this contract is applied; stored identities use real names.
 */
export const RelativePathSchema = z.string().min(1).refine(
  (value) =>
    !isAbsolute(value) && !/[\\\p{Cc}:?#]/u.test(value) &&
    value.split("/").every((part) =>
      part !== "" && part !== "." && part !== ".."
    ),
  "Expected a normalized relative file path without traversal or URL suffixes",
);

/** Supporting Markdown selected independently from the skill's root router. */
export const DocumentPathSchema = RelativePathSchema.refine(
  (value) => value.endsWith(".md") && value !== "SKILL.md",
  "Expected a supporting Markdown document, not the root SKILL.md",
);

/** Installed telemetry and case identity: `<skill>/<document>.md`. */
export const InstalledReferenceSchema = z.string().refine((value) => {
  const [skill, ...parts] = value.split("/");
  return SkillIdSchema.safeParse(skill).success &&
    DocumentPathSchema.safeParse(parts.join("/")).success;
}, "Expected an installed skill and a safe supporting Markdown path");

/** Authored collection roots that a skill bundle may copy as shared resources. */
const sharedDirectories = new Set(["guides", "references", "handbook"]);

/** Root documents that remain useful without the collection checkout. */
const sharedFiles = new Set([
  "START.md",
  "GUIDANCE.md",
  "LICENSE",
  "LICENSE.md",
]);

/** Return whether a canonical path belongs to shared, distributable guidance. */
export function isSharedPath(path: string): boolean {
  return RelativePathSchema.safeParse(path).success &&
    (sharedFiles.has(path) || sharedDirectories.has(path.split("/")[0]));
}

/** Resolve one installed reference to its single authored source path. */
export function referenceSource(reference: string): string {
  InstalledReferenceSchema.parse(reference);
  const [skill, ...parts] = reference.split("/");
  const document = parts.join("/");
  const prefix = "references/shared/";
  if (document.startsWith(prefix)) {
    const source = document.slice(prefix.length);
    if (!isSharedPath(source)) {
      throw new Error(`Unsupported shared reference: ${reference}`);
    }
    return source;
  }
  return `skills/${skill}/${document}`;
}

/** Return a skill-relative destination without introducing cross-skill files. */
export function installedPath(skill: string, source: string): string {
  SkillIdSchema.parse(skill);
  RelativePathSchema.parse(source);
  const prefix = `skills/${skill}/`;
  if (source.startsWith(prefix)) {
    const path = source.slice(prefix.length);
    if (path.startsWith("references/shared/")) {
      throw new Error(`Source uses reserved generated directory: ${source}`);
    }
    return path;
  }
  if (!isSharedPath(source)) {
    throw new Error(
      `Source is not owned by ${skill} or shared guidance: ${source}`,
    );
  }
  return `references/shared/${source}`;
}

/**
 * Classify authored behavior separately from indexes, attribution and snapshots.
 * Nested operational documents remain covered; only named support locations are
 * excluded. Generated duplicates use the classification of their source.
 */
export function isOperationalDocument(source: string): boolean {
  if (!source.endsWith(".md")) return false;
  const parts = source.split("/");
  const name = parts.at(-1)!;
  if (
    name === "SKILL.md" || name === "resources.md" ||
    /^(?:LICENSE|CHANGELOG|NOTICE)(?:\.[^.]+)?$/i.test(name) ||
    sharedFiles.has(source)
  ) return false;
  if (
    parts.some((part) =>
      ["sources", "assets", "examples", "templates"].includes(part)
    )
  ) return false;
  return !/\/references\/vercel-(?:react-best-practices|composition-patterns)\/rules\//
    .test(source);
}

/** Resolve an already normalized relative path while retaining its owning root. */
export function withinRoot(root: string, path: string): string {
  RelativePathSchema.parse(path);
  const target = resolve(root, path);
  const relation = relative(resolve(root), target);
  if (
    isAbsolute(relation) || relation === ".." || relation.startsWith(`..${sep}`)
  ) {
    throw new Error(`Path escapes its root: ${path}`);
  }
  return target;
}

/**
 * Test directory containment by path components, including the root itself.
 * Callers must resolve or reject symlinks before using this for write ownership.
 * Names such as `..checkpoint` are ordinary children, not parent traversal.
 */
export function containsPath(root: string, path: string): boolean {
  const relation = relative(resolve(root), resolve(path));
  return !isAbsolute(relation) && relation !== ".." &&
    !relation.startsWith(`..${sep}`);
}
