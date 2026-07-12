import { parseArgs } from "@std/cli";
import { dirname, fromFileUrl, join } from "@std/path";

const args = parseArgs(Deno.args, { string: ["baseline", "candidate"], boolean: ["allow-longer"], default: { baseline: "", candidate: "" } });
if (!args.baseline || !args.candidate) throw new Error("Pass --baseline and --candidate report JSON");
const root = join(dirname(fromFileUrl(import.meta.url)), "..");
const baseline = JSON.parse(await Deno.readTextFile(join(root, args.baseline)));
const candidate = JSON.parse(await Deno.readTextFile(join(root, args.candidate)));
const required = ["validUnseenScore", "adversarialScore", "compositionScore", "safetyScore"];
for (const key of required) if (typeof baseline[key] !== "number" || typeof candidate[key] !== "number") throw new Error("Missing metric " + key);
const regressions = required.filter((key) => candidate[key] < baseline[key]);
const improved = candidate.validUnseenScore > baseline.validUnseenScore;
const efficient = args["allow-longer"] || candidate.skillTokens <= baseline.skillTokens * 1.1;
if (!improved || regressions.length || !efficient) {
  console.error(JSON.stringify({ accepted: false, improved, regressions, efficient }, null, 2));
  Deno.exit(1);
}
console.log(JSON.stringify({ accepted: true, improved, regressions, efficient }, null, 2));

