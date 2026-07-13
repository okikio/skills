# SkillOpt-style Codex optimization: iteration 3

## Objective

Reduce composed context and modernize high-risk Deno contracts.

## Accepted edits

- Moved 331 lines of Deno's general lifecycle into a conditional standalone
  reference.
- Reduced the always-loaded Deno root from roughly 480 lines to about 150.
- Kept standalone installation complete while letting deliver-software own the
  lifecycle when both skills activate.
- Repaired the skill-local validator's nonexistent README requirement.
- Replaced audit mode claims based solely on manifest presence with an observed
  manifest-shape field and a Zod v4 report schema.
- Corrected permission ignore semantics and its supported categories.
- Added deno ci and deno pack to current command and publication guidance.
- Updated the CI template to use deno ci.
- Repaired OpenAI interface metadata without adding host fields to portable
  SKILL.md files.

## Gate

The composition candidate has lower root-context cost and fewer competing
lifecycle instructions. Deno-specific manifest, permission, package, workspace,
and artifact guidance remains available through selective references.

A measured token reduction awaits real host trajectory telemetry. The line-count
reduction is structural evidence, not a model-performance claim.
