import { createHash } from "node:crypto";

/**
 * Returns the SHA-256 digest for one UTF-8 string.
 *
 * Use this for authored JSON/text records whose byte representation is already
 * defined by the caller. File hashing uses `file()` so large inputs remain
 * streamed instead of being materialized as one JavaScript string.
 */
export async function text(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns the SHA-256 digest for one file without materializing its body.
 *
 * The fixed read buffer keeps JavaScript memory independent from file size.
 * The file handle is always closed, including when reading or hashing fails.
 */
export async function file(path: string): Promise<string> {
  const input = await Deno.open(path, { read: true });
  const hash = createHash("sha256");
  const buffer = new Uint8Array(64 * 1024);

  try {
    while (true) {
      const read = await input.read(buffer);
      if (read === null) break;
      hash.update(buffer.subarray(0, read));
    }
  } finally {
    input.close();
  }

  return hash.digest("hex");
}
