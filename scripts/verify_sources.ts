import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringArgument } from "../src/args.ts";
import { SourceRegistrySchema } from "../src/eval_schema.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const attachments = stringArgument("attachments");
if (!attachments) {
  throw new Error("Pass the attachment directory with --attachments <path>");
}

const registry = SourceRegistrySchema.parse(
  JSON.parse(await Deno.readTextFile(join(root, "evals", "sources.json"))),
);
const expectedByArtifact = new Map<string, string>();
const claimPathsByArtifact = new Map<string, Set<string>>();
let records = 0;
for (const source of registry.sources) {
  if (!source.sha256) continue;
  records++;
  const previous = expectedByArtifact.get(source.artifact);
  if (previous && previous !== source.sha256) {
    throw new Error(`${source.artifact} has conflicting registered digests`);
  }
  expectedByArtifact.set(source.artifact, source.sha256);
  const claims = claimPathsByArtifact.get(source.artifact) ?? new Set<string>();
  for (const claimPath of source.claimPaths) claims.add(claimPath);
  claimPathsByArtifact.set(source.artifact, claims);
}

const failures: string[] = [];
let verifiedClaims = 0;
for (const [artifact, expected] of [...expectedByArtifact].sort()) {
  const path = join(attachments, artifact);
  const hash = createHash("sha256");
  try {
    for await (const chunk of createReadStream(path)) hash.update(chunk);
  } catch (error) {
    failures.push(`${artifact}: unavailable: ${error}`);
    continue;
  }
  const actual = hash.digest("hex");
  if (actual !== expected) {
    failures.push(`${artifact}: expected ${expected}, received ${actual}`);
  }
  const claimPaths = claimPathsByArtifact.get(artifact) ?? new Set<string>();
  if (!artifact.endsWith(".zip") || claimPaths.size === 0) continue;
  const listing = await new Deno.Command("unzip", {
    args: ["-Z1", path],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!listing.success) {
    failures.push(
      `${artifact}: cannot inspect archive entries: ${
        new TextDecoder().decode(listing.stderr).trim()
      }`,
    );
    continue;
  }
  const entries = new TextDecoder().decode(listing.stdout).split("\n");
  for (const claimPath of claimPaths) {
    const normalized = claimPath.replace(/^\.\//, "").replace(/\/$/, "");
    if (
      !entries.some((entry) =>
        entry === normalized || entry.startsWith(`${normalized}/`)
      )
    ) {
      failures.push(`${artifact}: claim path not found: ${claimPath}`);
      continue;
    }
    verifiedClaims++;
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  Deno.exit(1);
}
console.log(
  `Verified ${records} source records across ${expectedByArtifact.size} ` +
    `distinct uploaded artifacts and ${verifiedClaims} archive claim paths.`,
);
