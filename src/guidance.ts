import {
  isAbsolute,
  join,
  parse,
  posix,
  relative,
  resolve,
  sep,
} from "node:path";
import type { Definition, Image, Link, Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { isMap, parseDocument } from "yaml";
import { z } from "zod";
import { walkFiles } from "./files.ts";
import {
  containsPath,
  installedPath,
  isOperationalDocument,
  isSharedPath,
  referenceSource,
  RelativePathSchema,
  SkillIdSchema,
  withinRoot,
} from "./paths.ts";

/** Metadata defined by the portable Agent Skills format. */
export const SkillMetadataSchema = z.strictObject({
  name: SkillIdSchema,
  description: z.string().trim().min(1).max(1024),
  license: z.string().optional(),
  compatibility: z.string().min(1).max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  "allowed-tools": z.string().optional(),
});

/** Validated portable metadata, independent of a particular agent host. */
export type SkillMetadataType = z.infer<typeof SkillMetadataSchema>;

/** Link-bearing syntax nodes provided by the maintained Markdown parser. */
type LinkNode = Definition | Image | Link;

/** A real Markdown link, image or reference definition and its source range. */
export interface MarkdownLink {
  /** Decoded Markdown destination, including any query or fragment. */
  readonly url: string;
  /** Inclusive UTF-16 offset in the original document. */
  readonly start: number;
  /** Exclusive UTF-16 offset in the original document. */
  readonly end: number;
}

/** A local source dependency or an optional cross-skill source route. */
export interface GuidanceLink {
  /** Original decoded Markdown destination. */
  readonly url: string;
  /** Canonical path from the collection root. */
  readonly source: string;
  /** Query and fragment retained when the destination moves. */
  readonly suffix: string;
  /** Another skill is a companion route, never an implicitly copied dependency. */
  readonly companion?: string;
}

/** Authored file and its deterministic location in one installed skill. */
export interface GuidanceFile {
  /** Canonical path from the collection root. */
  readonly source: string;
  /** Installed path relative to this skill folder. */
  readonly path: string;
}

/** Complete copied files and reachable document ownership for one skill. */
export interface GuidanceGraph {
  /** Physical collection root used for safe reads. Never written to manifests. */
  readonly root: string;
  /** Portable skill identifier. */
  readonly skill: string;
  /** Parsed metadata from the authored entrypoint. */
  readonly metadata: SkillMetadataType;
  /** Every original skill file plus its shared document and asset closure. */
  readonly files: ReadonlyMap<string, GuidanceFile>;
  /** Bounded Markdown bytes decoded once for graph analysis and publication. */
  readonly documents: ReadonlyMap<string, string>;
  /** Local navigation dependencies, keyed by authored Markdown source path. */
  readonly links: ReadonlyMap<string, readonly GuidanceLink[]>;
  /** Source paths reachable through Markdown links from the entrypoint. */
  readonly reachable: ReadonlySet<string>;
  /** Referenced companion names, without implicitly installing their trees. */
  readonly companions: readonly string[];
}

/** A bound on dependency expansion, including files found through document links. */
const MAX_FILES = 20_000;

/** Markdown parsing is bounded independently from binary asset copying. */
const MAX_MARKDOWN_BYTES = 1024 * 1024;

/** Local build and interpreter caches are not distributable skill content. */
const excludedDirectories = new Set([".git", "node_modules", "__pycache__"]);

/** Decode a local destination while rejecting machine-specific file URLs. */
function localDestination(
  url: string,
): { path: string; suffix: string } | undefined {
  if (!url || url.startsWith("#")) return undefined;
  if (/^(?:file|[a-z]):/i.test(url)) {
    throw new Error(`Machine-specific file link is not portable: ${url}`);
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return undefined;
  const suffixAt = url.search(/[?#]/);
  const raw = suffixAt === -1 ? url : url.slice(0, suffixAt);
  const suffix = suffixAt === -1 ? "" : url.slice(suffixAt);
  const path = decodeURIComponent(raw);
  if (!path) return undefined;
  if (isAbsolute(path) || /[\\\p{Cc}]/u.test(path)) {
    throw new Error(`Absolute or invalid local link: ${url}`);
  }
  return { path, suffix };
}

/** Find leading delimiters without assuming that their content is metadata. */
function leadingBlock(
  source: string,
): { text: string; end: number } | undefined {
  const opening = source.match(/^---\r?\n/);
  if (!opening) return undefined;
  const rest = source.slice(opening[0].length);
  const closing = /^---[ \t]*\r?$/m.exec(rest);
  if (!closing) return undefined;
  return {
    text: rest.slice(0, closing.index),
    end: opening[0].length + closing.index + closing[0].length,
  };
}

/**
 * Recognize metadata only when the delimited content is a valid YAML mapping.
 * Two Markdown thematic rules can enclose ordinary prose and links; those must
 * remain part of the document graph instead of disappearing as frontmatter.
 */
function frontmatter(
  source: string,
): { text: string; end: number } | undefined {
  const block = leadingBlock(source);
  if (!block) return undefined;
  const document = parseDocument(block.text, { uniqueKeys: true });
  if (document.errors.length > 0 || !isMap(document.contents)) return undefined;
  return block;
}

/** Parse actual YAML, including duplicate-key errors and non-string metadata. */
export function skillMetadata(
  source: string,
  expectedName: string,
): SkillMetadataType {
  const block = leadingBlock(source);
  if (!block) throw new Error("SKILL.md must begin with YAML frontmatter");
  const document = parseDocument(block.text, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(document.errors.map((error) => error.message).join("\n"));
  }
  const metadata = SkillMetadataSchema.parse(
    document.toJS({ maxAliasCount: 0 }),
  );
  if (metadata.name !== expectedName) {
    throw new Error(
      `Skill name ${metadata.name} does not match ${expectedName}`,
    );
  }
  return metadata;
}

/** Keep source offsets while excluding YAML values from Markdown navigation. */
function markdown(source: string) {
  const block = frontmatter(source);
  const input = block
    ? source.slice(0, block.end).replace(/[^\r\n]/g, " ") +
      source.slice(block.end)
    : source;
  return fromMarkdown(input);
}

/** Visit syntax nodes without inspecting text inside code fences or code spans. */
function visit(node: Nodes, action: (node: Nodes) => void): void {
  action(node);
  if ("children" in node) {
    for (const child of node.children) visit(child, action);
  }
}

/** Narrow destinations to parser-owned nodes, including reference-style links. */
function isLink(node: Nodes): node is LinkNode {
  return node.type === "link" || node.type === "image" ||
    node.type === "definition";
}

/** Return real Markdown destinations; example links inside code remain literal. */
export function markdownLinks(source: string): MarkdownLink[] {
  const links: MarkdownLink[] = [];
  visit(markdown(source), (node) => {
    if (!isLink(node)) return;
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) {
      throw new Error("Markdown parser omitted source offsets for a link");
    }
    links.push({ url: node.url, start, end });
  });
  return links;
}

/**
 * Rewrite changed link nodes only. The Markdown serializer owns escaping;
 * original prose, whitespace and code examples outside those nodes stay intact.
 * An outer link absorbs edits to a nested image, so replacements never overlap.
 */
export function rewriteMarkdown(
  source: string,
  destination: (url: string) => string,
): string {
  const edits: { start: number; end: number; text: string }[] = [];
  function rewrite(node: Nodes): boolean {
    const before = edits.length;
    let changed = false;
    if ("children" in node) {
      for (const child of node.children) changed = rewrite(child) || changed;
    }
    if (isLink(node)) {
      const url = destination(node.url);
      changed = changed || url !== node.url;
      node.url = url;
      if (changed) {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start === undefined || end === undefined) {
          throw new Error("Markdown parser omitted source offsets for a link");
        }
        edits.splice(before);
        edits.push({ start, end, text: toMarkdown(node).trimEnd() });
      }
    }
    return changed;
  }
  rewrite(markdown(source));
  let result = source;
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  return result;
}

/**
 * Inspect each path component so neither a file nor an intermediate directory
 * can redirect a read through a symlink. Collections distribute ordinary files.
 */
export async function sourceFile(
  root: string,
  source: string,
): Promise<string> {
  const path = withinRoot(root, source);
  let cursor = resolve(root);
  for (const part of source.split("/")) {
    cursor = join(cursor, part);
    const info = await Deno.lstat(cursor);
    if (info.isSymlink) {
      throw new Error(`Symbolic links are not portable sources: ${source}`);
    }
  }
  const info = await Deno.lstat(path);
  if (!info.isFile) {
    throw new Error(`Required source is not an ordinary file: ${source}`);
  }
  return path;
}

/** Resolve case/telemetry identity to its validated canonical authored file. */
export async function resolveReference(
  root: string,
  reference: string,
): Promise<string> {
  return await sourceFile(root, referenceSource(reference));
}

/**
 * Verify a published skill without consulting its authored source checkout.
 * This also validates an optimizer's new links before candidate bytes are pinned
 * for held-out evaluation. Required local files must remain inside this skill.
 */
export async function validateInstalledSkill(
  root: string,
  skill: string,
): Promise<void> {
  skillMetadata(await readMarkdown(root, "SKILL.md"), skill);
  let count = 0;
  for await (const path of walkFiles(root)) {
    if (++count > MAX_FILES) {
      throw new Error(`Skill exceeds ${MAX_FILES} files`);
    }
    if (!path.endsWith(".md")) continue;
    const from = relative(root, path).replaceAll("\\", "/");
    for (const { url } of markdownLinks(await readMarkdown(root, from))) {
      const local = localDestination(url);
      if (!local) continue;
      const source = posix.normalize(
        posix.join(posix.dirname(from), local.path),
      );
      await sourceFile(root, source);
    }
  }
}

/** Enumerate the physical skill tree without silently omitting unsupported files. */
async function skillFiles(root: string, skill: string): Promise<string[]> {
  const files: string[] = [];
  async function collect(directory: string): Promise<void> {
    const entries = [];
    for await (const entry of Deno.readDir(withinRoot(root, directory))) {
      entries.push(entry);
    }
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.name === ".DS_Store" || excludedDirectories.has(entry.name)) {
        continue;
      }
      const source = `${directory}/${entry.name}`;
      if (entry.isSymlink) {
        throw new Error(`Symbolic links are not portable sources: ${source}`);
      }
      if (entry.isDirectory) await collect(source);
      else if (entry.isFile) files.push(source);
      else throw new Error(`Unsupported skill file: ${source}`);
      if (files.length > MAX_FILES) {
        throw new Error(`Skill exceeds ${MAX_FILES} files`);
      }
    }
  }
  await collect(`skills/${skill}`);
  return files;
}

/** Read bounded Markdown without accepting invalid UTF-8 or large surprise inputs. */
async function readMarkdown(root: string, source: string): Promise<string> {
  const path = await sourceFile(root, source);
  if ((await Deno.stat(path)).size > MAX_MARKDOWN_BYTES) {
    throw new Error(`Markdown exceeds ${MAX_MARKDOWN_BYTES} bytes: ${source}`);
  }
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
    await Deno.readFile(path),
  );
}

/** Resolve a local Markdown destination while leaving external URLs untouched. */
async function resolveLink(
  root: string,
  skill: string,
  from: string,
  url: string,
): Promise<GuidanceLink | undefined> {
  const local = localDestination(url);
  if (!local) return undefined;
  let source = posix.normalize(posix.join(posix.dirname(from), local.path));
  RelativePathSchema.parse(source);
  const pieces = source.split("/");
  let companion: string | undefined;
  if (pieces[0] === "skills" && pieces[1] !== skill) {
    companion = SkillIdSchema.parse(pieces[1]);
    if (pieces.length === 2) source = `${source}/SKILL.md`;
  } else if (!source.startsWith(`skills/${skill}/`) && !isSharedPath(source)) {
    throw new Error(
      `${from}: local link is outside distributable guidance: ${url}`,
    );
  }
  await sourceFile(root, source);
  return {
    url,
    source,
    suffix: local.suffix,
    ...(companion ? { companion } : {}),
  };
}

/**
 * Inspect a skill's real resource graph. All authored skill files are packaged,
 * shared dependencies follow Markdown links, and companions remain named routes.
 * `reachable` separately proves that operational content is actually routed.
 */
export async function guidanceGraph(
  root: string,
  skill: string,
): Promise<GuidanceGraph> {
  SkillIdSchema.parse(skill);
  root = await Deno.realPath(root);
  const entrypoint = `skills/${skill}/SKILL.md`;
  const metadata = skillMetadata(await readMarkdown(root, entrypoint), skill);
  const files = new Map<string, GuidanceFile>();
  const documents = new Map<string, string>();
  const links = new Map<string, GuidanceLink[]>();
  const pending: string[] = [];
  function include(source: string): void {
    if (files.has(source)) return;
    if (files.size >= MAX_FILES) {
      throw new Error(`Skill exceeds ${MAX_FILES} files`);
    }
    files.set(source, { source, path: installedPath(skill, source) });
    if (source.endsWith(".md")) pending.push(source);
  }
  for (const source of await skillFiles(root, skill)) include(source);
  const companions = new Set<string>();
  for (let index = 0; index < pending.length; index++) {
    const source = pending[index];
    const content = await readMarkdown(root, source);
    documents.set(source, content);
    const dependencies: GuidanceLink[] = [];
    for (const link of markdownLinks(content)) {
      const dependency = await resolveLink(root, skill, source, link.url);
      if (!dependency) continue;
      dependencies.push(dependency);
      if (dependency.companion) companions.add(dependency.companion);
      else include(dependency.source);
    }
    links.set(source, dependencies);
  }
  // A copied license does not create a new operational capability.
  try {
    await sourceFile(root, "LICENSE");
    include("LICENSE");
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  const reachable = new Set<string>();
  function follow(source: string): void {
    if (reachable.has(source)) return;
    reachable.add(source);
    for (const link of links.get(source) ?? []) {
      if (!link.companion) follow(link.source);
    }
  }
  follow(entrypoint);
  return {
    root,
    skill,
    metadata,
    files,
    documents,
    links,
    reachable,
    companions: [...companions].sort(),
  };
}

/** Return canonical operational sources reachable from a skill or resource index. */
export function operationalDocuments(graph: GuidanceGraph): string[] {
  return [...graph.reachable].filter(isOperationalDocument).sort();
}

/** Return authored operational skill files that no entrypoint route can reach. */
export function unroutedDocuments(graph: GuidanceGraph): string[] {
  return [...graph.files.keys()].filter((source) =>
    source.startsWith(`skills/${graph.skill}/`) &&
    isOperationalDocument(source) &&
    !graph.reachable.has(source)
  ).sort();
}

/**
 * Inventory authored operational documents once, before per-skill duplication.
 * A shared source needs one capability owner even when many bundles consume it.
 */
export async function operationalSources(root: string): Promise<string[]> {
  root = await Deno.realPath(root);
  const sources: string[] = [];
  async function collect(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(withinRoot(root, directory))) {
      if (excludedDirectories.has(entry.name) || entry.name === ".DS_Store") {
        continue;
      }
      const source = `${directory}/${entry.name}`;
      if (entry.isSymlink) {
        throw new Error(`Symbolic guidance source: ${source}`);
      }
      if (entry.isDirectory) await collect(source);
      else if (entry.isFile && isOperationalDocument(source)) {
        sources.push(source);
      }
      if (sources.length > MAX_FILES) {
        throw new Error(`Guidance exceeds ${MAX_FILES} documents`);
      }
    }
  }
  for (const directory of ["skills", "guides", "references", "handbook"]) {
    try {
      const info = await Deno.lstat(withinRoot(root, directory));
      if (!info.isDirectory || info.isSymlink) {
        throw new Error(
          `Guidance root is not an ordinary directory: ${directory}`,
        );
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
    await collect(directory);
  }
  return sources.sort();
}

/** Render a relocated local URL or an explicit public route to an optional skill. */
export function bundledLink(
  graph: GuidanceGraph,
  from: string,
  link: GuidanceLink,
  sourceRef = "main",
): string {
  if (link.companion) {
    const path = link.source.split("/").map(encodeURIComponent).join("/");
    const ref = sourceRef.split("/").map(encodeURIComponent).join("/");
    return `https://github.com/okikio/skills/blob/${ref}/${path}${link.suffix}`;
  }
  const fromPath = installedPath(graph.skill, from);
  const target = installedPath(graph.skill, link.source);
  const path = posix.relative(posix.dirname(fromPath), target) ||
    posix.basename(target);
  return path.split("/").map(encodeURIComponent).join("/") + link.suffix;
}

/** Validate that an output cannot replace authored guidance or its parent tree. */
export function assertOutput(root: string, output: string): void {
  const source = resolve(root);
  const target = resolve(output);
  if (containsPath(target, source)) {
    throw new Error("Bundle output must not contain the source collection");
  }
  for (
    const directory of [
      "skills",
      "guides",
      "references",
      "handbook",
      "src",
      "scripts",
      "tests",
      "evals",
    ]
  ) {
    const protectedRoot = resolve(root, directory);
    if (containsPath(protectedRoot, target)) {
      throw new Error(`Bundle output would modify authored ${directory}`);
    }
  }
}

/**
 * Resolve an existing input directory after rejecting every symbolic ancestor.
 * External ordinary directories remain valid candidate inputs. Resolving only
 * the leaf would miss a parent link that aliases an output slated for removal.
 */
export async function physicalDirectory(path: string): Promise<string> {
  const target = resolve(path);
  let cursor = parse(target).root;
  for (const part of target.slice(cursor.length).split(sep)) {
    cursor = join(cursor, part);
    const info = await Deno.lstat(cursor);
    if (info.isSymlink || !info.isDirectory) {
      throw new Error(`Input ancestor is not an ordinary directory: ${cursor}`);
    }
  }
  return await Deno.realPath(target);
}

/**
 * Validate every existing output ancestor before creating directories. Lexical
 * containment alone cannot detect a directory link that redirects a write into
 * the source collection or another unrelated tree.
 */
export async function safeOutput(
  root: string,
  output: string,
): Promise<string> {
  root = await Deno.realPath(root);
  const target = resolve(output);
  assertOutput(root, target);
  let cursor = parse(target).root;
  for (const part of target.slice(cursor.length).split(sep)) {
    cursor = join(cursor, part);
    try {
      const info = await Deno.lstat(cursor);
      if (info.isSymlink || !info.isDirectory) {
        throw new Error(
          `Output ancestor is not an ordinary directory: ${cursor}`,
        );
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) break;
      throw error;
    }
  }
  return target;
}
