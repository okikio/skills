# SkillOpt integration

SkillOpt optimizes generated candidates, never the canonical skill in place.

1. Run 'deno task skillopt:export --skill deno-software'.
2. Install Microsoft SkillOpt in an isolated Python environment from a pinned
   release.
3. Implement the repository benchmark adapter described in
   'benchmark-contract.md'.
4. Train only with train and valid-seen data.
5. Export the best candidate into '.skillopt/<skill>/candidates/'.
6. Evaluate valid-unseen, transfer, adversarial, composition, and frozen tests
   outside the optimizer.
7. Use 'deno task skillopt:gate' to reject regressions.
8. Review and port accepted edits manually with their supporting eval changes.

The optimizer may add, replace, or delete procedural text. Protected material
includes frontmatter, security rules, source citations, frozen-test isolation,
cross-skill ownership, and the rule against claiming checks that did not run.
