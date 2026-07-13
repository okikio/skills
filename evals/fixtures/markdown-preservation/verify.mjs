import { readFile } from "node:fs/promises";

const target = await readFile("target.md", "utf8");
const untouched = await readFile("untouched.md", "utf8");
if (!/result stream is stable|stable result stream/i.test(target)) {
  throw new Error("target paragraph was not corrected");
}
if (!target.includes("| :--- | ---: | :---: |")) {
  throw new Error("target table formatting changed");
}
const expected = `# Authored layout

This paragraph has intentional wrapping that must stay exactly as authored,
including this second line and the deliberately placed comma,
which makes formatter churn visible.

| A  | B     |
|:---|------:|
| x  | \`one\` |
`;
if (untouched !== expected) throw new Error("unrelated Markdown changed");
