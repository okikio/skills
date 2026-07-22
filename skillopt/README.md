# SkillOpt integration

SkillOpt optimizes generated candidates, never the canonical skill in place.

1. Run `deno task skillopt:export --skill deno-software --mode optimize`.
   Add immutable companions with repeated `--with` flags.
   For an individual-reference pass, add exactly one path such as
   `--reference references/optique.md`. The root router and every other
   reference then remain immutable.
2. Install Microsoft SkillOpt in an isolated Python environment from a pinned
   release.
3. Implement the repository benchmark adapter described in
   'benchmark-contract.md'.
4. Train only with train and valid-seen data.
5. Export the best candidate under `.skillopt/<skill>/optimize/candidate/`.
   Run `deno task skillopt:verify --workspace
   .skillopt/<skill>/optimize/workspace.json` after every optimizer process and
   reject the candidate if an immutable file changed or a skill file appeared
   outside the manifest.
6. Create a held-out bundle with `--mode evaluate`. It contains valid-unseen,
   transfer, and adversarial cases but never frozen cases.
7. Create the frozen release bundle only with `--mode release`. Never expose it
   to optimizer prompts, candidate reflection, or failure reports.
8. Use `deno task skillopt:gate` on paired aggregate reports to reject
   regressions.
9. Review and port accepted edits manually with their supporting eval changes.

The optimizer may add, replace, or delete procedural text. Protected material
includes frontmatter, security rules, source citations, frozen-test isolation,
cross-skill ownership, and the rule against claiming checks that did not run.

The exporter preserves the target and companion skill directory trees. It does
not concatenate every reference into one context file because that defeats
selective loading and makes reference efficiency impossible to measure. Only the
target skill's `SKILL.md` is mutable during a root-router optimization pass. A
reference pass makes exactly one selected reference mutable. Every other
candidate file and all companion paths remain immutable. Evaluate and release
workspaces have no mutable paths. `immutablePaths` is not a sandbox by itself;
the rollout harness must retain a trusted copy of the exported manifest and run
the digest verifier after the target or optimizer exits.

Run `deno task skillopt:matrix` before release to prove that every registered
capability reference, root router, and frozen composition topology can be
exported and that every resulting workspace passes the immutability verifier.
