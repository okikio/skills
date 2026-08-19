import { relative } from "node:path";
import { walkFiles } from "./files.ts";
import * as hash from "./hash.ts";

/** Maximum file size retained as text for deterministic line-change metrics. */
const MAX_TEXT_BYTES = 1024 * 1024;
/** Maximum files inspected from one evaluation tree. */
const MAX_FILES = 20_000;
/** Maximum LCS matrix cells used for exact text line-change accounting. */
const MAX_LCS_CELLS = 1_000_000;

/** Immutable identity retained for one file in a tree snapshot. */
export type FileSnapshotType = {
  /** SHA-256 identity for the complete file bytes. */
  readonly digest: string;
  /** Strict UTF-8 content retained only when the file is small enough. */
  readonly text?: string;
};

/** Deterministic snapshot keyed by paths relative to the inspected tree root. */
export type SnapshotType = ReadonlyMap<string, FileSnapshotType>;

/** File and line changes observed between two deterministic snapshots. */
export type ChangeType = {
  /** Sorted relative paths whose bytes differ. */
  readonly changedFiles: string[];
  /** Added logical text lines when bounded comparison is possible. */
  readonly addedLines: number;
  /** Deleted logical text lines when bounded comparison is possible. */
  readonly deletedLines: number;
};

/**
 * Captures one file tree without assuming every file is UTF-8 text.
 *
 * Complete files are represented by streamed SHA-256 digests. Small files are
 * also decoded with strict UTF-8 so evaluation can compute readable line-change
 * metrics. Binary and large files still participate through their digest. The
 * file-count limit prevents an adversarial rollout from creating an unbounded
 * evaluation scan.
 */
export async function snapshot(root: string): Promise<SnapshotType> {
  const files = new Map<string, FileSnapshotType>();
  let count = 0;

  for await (const path of walkFiles(root)) {
    count++;
    if (count > MAX_FILES) {
      throw new Error(`Tree exceeds ${MAX_FILES} files`);
    }

    const stat = await Deno.stat(path);
    let text: string | undefined;
    if (stat.size <= MAX_TEXT_BYTES) {
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(
          await Deno.readFile(path),
        );
      } catch {
        // Binary files still participate through their complete byte digest.
      }
    }

    files.set(relative(root, path), {
      digest: await hash.file(path),
      text,
    });
  }

  return files;
}

/** Returns one stable digest for an already bounded tree snapshot. */
export async function digest(files: SnapshotType): Promise<string> {
  const records = [...files]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([path, file]) => `${path}\0${file.digest}`);
  return await hash.text(records.join("\n"));
}

/** Captures a tree and returns its stable content digest. */
export async function getDigest(root: string): Promise<string> {
  return await digest(await snapshot(root));
}

/**
 * Counts added/deleted lines with an exact LCS for ordinary text fixtures.
 *
 * Large line products use a conservative whole-file replacement count so one
 * generated file cannot allocate an unbounded dynamic-programming matrix.
 */
function lineChanges(before: string, after: string): [number, number] {
  const left = before.split(/\r?\n/);
  const right = after.split(/\r?\n/);
  if (left.length * right.length > MAX_LCS_CELLS) {
    return [right.length, left.length];
  }

  const next = new Uint32Array(right.length + 1);
  const current = new Uint32Array(right.length + 1);
  for (let row = left.length - 1; row >= 0; row--) {
    current.fill(0);
    for (let column = right.length - 1; column >= 0; column--) {
      current[column] = left[row] === right[column]
        ? next[column + 1] + 1
        : Math.max(next[column], current[column + 1]);
    }
    next.set(current);
  }

  const retained = next[0];
  return [right.length - retained, left.length - retained];
}

/** Compares two snapshots and returns deterministic file/line change metrics. */
export function compare(before: SnapshotType, after: SnapshotType): ChangeType {
  const paths = new Set([...before.keys(), ...after.keys()]);
  const changedFiles: string[] = [];
  let addedLines = 0;
  let deletedLines = 0;

  for (const path of [...paths].sort()) {
    const oldFile = before.get(path);
    const newFile = after.get(path);
    if (oldFile?.digest === newFile?.digest) continue;
    changedFiles.push(path);

    if (oldFile?.text !== undefined && newFile?.text !== undefined) {
      const [added, deleted] = lineChanges(oldFile.text, newFile.text);
      addedLines += added;
      deletedLines += deleted;
    } else if (newFile?.text !== undefined) {
      addedLines += newFile.text.split(/\r?\n/).length;
    } else if (oldFile?.text !== undefined) {
      deletedLines += oldFile.text.split(/\r?\n/).length;
    }
  }

  return { changedFiles, addedLines, deletedLines };
}

/**
 * Returns the complete byte size of ordinary files in one bounded tree.
 *
 * The same file-count limit as `snapshot()` applies so an adversarial candidate
 * cannot turn artifact-size accounting into an unbounded directory traversal.
 */
export async function getBytes(root: string): Promise<number> {
  let count = 0;
  let bytes = 0;
  for await (const path of walkFiles(root)) {
    count++;
    if (count > MAX_FILES) throw new Error(`Tree exceeds ${MAX_FILES} files`);
    bytes += (await Deno.stat(path)).size;
  }
  return bytes;
}
