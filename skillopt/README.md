# SkillOpt integration

SkillOpt optimizes generated candidates, never the canonical skill in place.

1. Run `deno task skillopt:export --skill deno-software --mode optimize`.
   Add immutable companions with repeated `--with` flags.
2. Install Microsoft SkillOpt in an isolated Python environment from a pinned
   release.
3. Implement the repository benchmark adapter described in
   'benchmark-contract.md'.
4. Train only with train and valid-seen data.
5. Export the best candidate under `.skillopt/<skill>/optimize/candidate/`.
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
target skill's `SKILL.md` is mutable during a root-router optimization pass;
candidate references and companion paths remain immutable.
