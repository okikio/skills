import { dirname, join, relative, resolve } from "node:path";
import { z } from "zod";
import {
  bundledLink,
  guidanceGraph,
  rewriteMarkdown,
  safeOutput,
  sourceFile,
  validateInstalledSkill,
} from "./guidance.ts";
import { walkFiles } from "./files.ts";
import * as hash from "./hash.ts";
import { RelativePathSchema, SkillIdSchema, withinRoot } from "./paths.ts";
import * as tree from "./tree.ts";

/** File provenance joins one authored owner to the bytes actually installed. */
export const BundleFileSchema = z.strictObject({
  source: RelativePathSchema,
  path: RelativePathSchema,
  sourceDigest: z.string().regex(/^[a-f0-9]{64}$/),
  digest: z.string().regex(/^[a-f0-9]{64}$/),
});

/** Deterministic manifest inside each self-contained skill folder. */
export const BundleManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  skill: SkillIdSchema,
  sourceRef: z.string().min(1),
  companions: z.array(SkillIdSchema),
  files: z.array(BundleFileSchema),
});

/** Source ownership and installed-byte evidence for a generated skill. */
export type BundleManifestType = z.infer<typeof BundleManifestSchema>;

/** Whole-pack marker permits safe replacement of this tool's generated output. */
export const BundleIndexSchema = z.strictObject({
  schemaVersion: z.literal(1),
  skills: z.array(z.strictObject({
    skill: SkillIdSchema,
    revision: z.string().regex(/^[a-f0-9]{64}$/),
  })).min(1),
});

/** Controls only source-document URLs; local dependencies always come from root. */
export interface BundleOptions {
  /** Git ref used by optional companion links. Defaults to the public main branch. */
  readonly sourceRef?: string;
}

/** An installed skill and its complete deterministic tree identity. */
export interface BundleResult {
  /** Portable skill name. */
  readonly skill: string;
  /** SHA-256 digest of all generated files, including the provenance manifest. */
  readonly revision: string;
  /** Generated provenance; it never stores an absolute source-machine path. */
  readonly manifest: BundleManifestType;
}

/** Stable names distinguish generated directories from arbitrary user content. */
const MANIFEST = "bundle.json";
const INDEX = "bundles.json";

/** Refuse symlink destinations and pre-existing files before writing a bundle. */
async function emptyDestination(destination: string): Promise<void> {
  try {
    const info = await Deno.lstat(destination);
    if (!info.isDirectory || info.isSymlink) {
      throw new Error(
        `Bundle destination is not an ordinary directory: ${destination}`,
      );
    }
    for await (const _entry of Deno.readDir(destination)) {
      throw new Error(`Bundle destination is not empty: ${destination}`);
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await Deno.mkdir(destination, { recursive: true });
}

/**
 * Build one independent skill from the authored collection. Shared documents
 * become regular files, links are relocated, and companions stay optional.
 * The caller supplies a new or empty destination and owns cleanup on failure.
 */
export async function materializeSkill(
  root: string,
  skill: string,
  destination: string,
  options: BundleOptions = {},
): Promise<BundleResult> {
  destination = await safeOutput(root, destination);
  const graph = await guidanceGraph(root, skill);
  const sourceRef = options.sourceRef ?? "main";
  if (!sourceRef || /[\p{Cc}?#]/u.test(sourceRef)) {
    throw new Error(
      "Source ref must be a non-empty Git ref without URL suffixes",
    );
  }
  if ([...graph.files.values()].some((file) => file.path === MANIFEST)) {
    throw new Error(`${skill}: ${MANIFEST} is reserved for bundle provenance`);
  }
  await emptyDestination(destination);
  const records: z.infer<typeof BundleFileSchema>[] = [];
  const paths = new Set<string>();
  for (
    const file of [...graph.files.values()].sort((a, b) =>
      a.path.localeCompare(b.path)
    )
  ) {
    if (paths.has(file.path)) {
      throw new Error(`Duplicate bundled path: ${file.path}`);
    }
    paths.add(file.path);
    const input = await sourceFile(graph.root, file.source);
    const output = withinRoot(destination, file.path);
    await Deno.mkdir(dirname(output), { recursive: true });
    const sourceDigest = await hash.file(input);
    if (file.source.endsWith(".md")) {
      const links = new Map((graph.links.get(file.source) ?? []).map((link) => [
        link.url,
        bundledLink(graph, file.source, link, sourceRef),
      ]));
      const source = graph.documents.get(file.source);
      if (source === undefined || await hash.text(source) !== sourceDigest) {
        throw new Error(`Source changed after graph analysis: ${file.source}`);
      }
      let content = rewriteMarkdown(source, (url) => links.get(url) ?? url);
      if (file.path === "SKILL.md" && graph.companions.length > 0) {
        content = content.trimEnd() + "\n\n## Optional companion skills\n\n" +
          "Links to other skills identify optional collaborators. Use a companion only when " +
          "it is installed and relevant; otherwise perform the required checks with the " +
          "available capabilities. Shared documents required by this skill are included " +
          "in this bundle. Companion skills are not installed implicitly.\n\n" +
          graph.companions.map((name) => `- \`${name}\``).join("\n") + "\n";
      }
      await Deno.writeTextFile(output, content);
    } else {
      await Deno.copyFile(input, output);
    }
    const mode = (await Deno.stat(input)).mode;
    if (mode !== null && Deno.build.os !== "windows") {
      await Deno.chmod(output, mode & 0o777);
    }
    if (await hash.file(input) !== sourceDigest) {
      throw new Error(`Source changed during bundling: ${file.source}`);
    }
    records.push({
      source: file.source,
      path: file.path,
      sourceDigest,
      digest: await hash.file(output),
    });
  }
  const manifest = BundleManifestSchema.parse({
    schemaVersion: 1,
    skill,
    sourceRef,
    companions: graph.companions,
    files: records,
  });
  await Deno.writeTextFile(
    join(destination, MANIFEST),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await validateInstalledSkill(destination, skill);
  return { skill, revision: await tree.getDigest(destination), manifest };
}

/**
 * Pin a copied optimize candidate after its workspace integrity was verified.
 * Only the declared document may differ from original bundle provenance. The
 * installed digest is refreshed while canonical source digests remain evidence
 * of the original input. Companion bundles never pass through this mutation.
 */
export async function pinCandidate(
  directory: string,
  skill: string,
  mutablePath: string,
): Promise<BundleResult> {
  const manifestPath = await sourceFile(directory, MANIFEST);
  const manifest = BundleManifestSchema.parse(
    JSON.parse(await Deno.readTextFile(manifestPath)),
  );
  if (manifest.skill !== skill) {
    throw new Error("Candidate bundle skill identity differs");
  }
  const records = new Map(manifest.files.map((file) => [file.path, file]));
  if (records.size !== manifest.files.length || !records.has(mutablePath)) {
    throw new Error(
      "Candidate provenance must identify each file and the mutable document",
    );
  }
  const seen = new Set<string>();
  for await (const path of walkFiles(directory)) {
    const relativePath = relative(directory, path).replaceAll("\\", "/");
    if (relativePath === MANIFEST) continue;
    const record = records.get(relativePath);
    if (!record) {
      throw new Error(`Unregistered candidate file: ${relativePath}`);
    }
    const digest = await hash.file(path);
    if (relativePath !== mutablePath && digest !== record.digest) {
      throw new Error(`Candidate dependency changed: ${relativePath}`);
    }
    record.digest = digest;
    seen.add(relativePath);
  }
  if (seen.size !== records.size) {
    throw new Error("Candidate is missing a bundled dependency");
  }
  await validateInstalledSkill(directory, skill);
  await Deno.writeTextFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return { skill, revision: await tree.getDigest(directory), manifest };
}

/** Discover only ordinary skill directories with an actual entrypoint. */
export async function skillNames(root: string): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(join(root, "skills"))) {
    if (entry.isSymlink) {
      throw new Error(`Symbolic skill directory: ${entry.name}`);
    }
    if (!entry.isDirectory) continue;
    try {
      await sourceFile(root, `skills/${entry.name}/SKILL.md`);
      names.push(SkillIdSchema.parse(entry.name));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  return names.sort();
}

/** Refuse replacing unrelated content, including extra files inside old output. */
async function replaceable(destination: string): Promise<boolean> {
  try {
    const info = await Deno.lstat(destination);
    if (info.isSymlink || !info.isDirectory) {
      throw new Error("Output must be an ordinary directory");
    }
    const entries = [];
    for await (const entry of Deno.readDir(destination)) entries.push(entry);
    if (entries.length === 0) return true;
    const index = BundleIndexSchema.parse(
      JSON.parse(await Deno.readTextFile(join(destination, INDEX))),
    );
    const expected = new Set([
      INDEX,
      ...index.skills.map((skill) => skill.skill),
    ]);
    if (entries.some((entry) => !expected.has(entry.name) || entry.isSymlink)) {
      throw new Error("Output contains files not owned by the previous bundle");
    }
    for (const skill of index.skills) {
      if (
        await tree.getDigest(join(destination, skill.skill)) !== skill.revision
      ) {
        throw new Error(`Previous bundle was modified: ${skill.skill}`);
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      try {
        await Deno.lstat(destination);
      } catch (missing) {
        if (missing instanceof Deno.errors.NotFound) return false;
        throw missing;
      }
    }
    throw new Error(
      `Refusing to replace unowned or modified output: ${destination}`,
      { cause: error },
    );
  }
}

/** Inspect occupancy without following a newly created symbolic destination. */
async function occupied(path: string): Promise<boolean> {
  try {
    await Deno.lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

/** Restore displaced output only while the destination remains unoccupied. */
async function recoverOutput(
  backup: string,
  destination: string,
  cause: unknown,
): Promise<never> {
  if (await occupied(destination)) {
    throw new Error(
      `Cannot publish bundle: ${cause}. A new destination exists; previous output is preserved at ${backup}`,
      { cause },
    );
  }
  try {
    await Deno.rename(backup, destination);
  } catch (restoreError) {
    throw new AggregateError(
      [cause, restoreError],
      `Cannot restore previous output; recover it from ${backup}`,
    );
  }
  throw new Error(
    `Cannot publish bundle: ${cause}. Previous output was restored to ${destination}`,
    { cause },
  );
}

/**
 * Build selected skills in a staging directory, then publish the completed pack.
 * An existing output is replaced only when its complete recorded bytes still
 * match this tool's manifest. The displaced directory is checked again before
 * publication. Recovery retains changed output and does not replace an observed
 * new destination; its backup path is reported instead.
 */
export async function materializePack(
  root: string,
  destination: string,
  selected?: readonly string[],
  options: BundleOptions = {},
): Promise<BundleResult[]> {
  root = await Deno.realPath(root);
  destination = await safeOutput(root, resolve(destination));
  const names = selected
    ? [...new Set(selected)].sort()
    : await skillNames(root);
  if (names.length === 0) throw new Error("Select at least one skill");
  for (const name of names) SkillIdSchema.parse(name);
  const exists = await replaceable(destination);
  await Deno.mkdir(dirname(destination), { recursive: true });
  const staging = await Deno.makeTempDir({
    dir: dirname(destination),
    prefix: ".skill-bundle-",
  });
  try {
    const results: BundleResult[] = [];
    for (const name of names) {
      results.push(
        await materializeSkill(root, name, join(staging, name), options),
      );
    }
    const index = BundleIndexSchema.parse({
      schemaVersion: 1,
      skills: results.map(({ skill, revision }) => ({ skill, revision })),
    });
    await Deno.writeTextFile(
      join(staging, INDEX),
      JSON.stringify(index, null, 2) + "\n",
    );
    const backup = `${staging}.previous`;
    let displaced = false;
    try {
      await safeOutput(root, destination);
      if (exists) {
        await Deno.rename(destination, backup);
        displaced = true;
        if (!await replaceable(backup)) {
          throw new Error("Previous output disappeared after displacement");
        }
      }
      if (await occupied(destination)) {
        throw new Error("Output appeared while the bundle was staged");
      }
      await Deno.rename(staging, destination);
      if (displaced) {
        await replaceable(backup);
        await Deno.remove(backup, { recursive: true });
      }
    } catch (error) {
      if (displaced) await recoverOutput(backup, destination, error);
      throw error;
    }
    return results;
  } finally {
    await Deno.remove(staging, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}
