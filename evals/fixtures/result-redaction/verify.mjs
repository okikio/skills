import { renderResult } from "./output.mjs";

const secret = "nested-secret-token";
const output = renderResult({ account: { token: secret }, ok: true });
if (output.includes(secret)) throw new Error("nested secret leaked");
const parsed = JSON.parse(output);
if (parsed.ok !== true) throw new Error("stable result shape was not preserved");
