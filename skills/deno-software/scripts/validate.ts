/** Validates the internal structure and references of this Agent Skill. */

const root = new URL("../", import.meta.url);
const required = [
  "SKILL.md",
  "README.md",
  "references/01-foundations.md",
  "references/02-releases.md",
  "references/12-verification.md",
  "scripts/audit.ts",
  "evals/cases.json",
];

for (const relative of required) {
  await Deno.stat(new URL(relative, root));
}

const skill = await Deno.readTextFile(new URL("SKILL.md", root));
if (!skill.startsWith("---\nname: deno-software\n")) {
  throw new Error("SKILL.md frontmatter is missing or malformed");
}

for (
  const match of skill.matchAll(
    /`((?:references|scripts|templates|examples|evals)\/[^`]+)`/g,
  )
) {
  const path = match[1];
  try {
    await Deno.stat(new URL(path, root));
  } catch (cause) {
    throw new Error(`Missing referenced path: ${path}`, { cause });
  }
}

console.log("deno-software skill structure is valid");
