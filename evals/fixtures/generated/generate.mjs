import { writeFile } from "node:fs/promises";
await writeFile("registry.ts", 'export { adapter } from "./legacy.ts";\n');
