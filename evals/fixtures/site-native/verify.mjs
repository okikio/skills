import { readFile } from "node:fs/promises";

const page = await readFile("src/index.astro", "utf8");
if (!page.includes("<details")) throw new Error("native disclosure is missing");
if (/Faq\.tsx|client:/.test(page)) {
  throw new Error("FAQ still hydrates an island");
}
