# SkillOpt-style Codex optimization: iteration 2

## Objective

Correct portability and control-flow defects before expanding domain prose.

## Independent evidence

Separate Deno, delivery, and evaluation subagents audited the repository without
editing it. All three found that the dominant failures were contradictions and
non-runnable tooling rather than missing generic advice.

## Accepted edits

- Removed host-specific Copilot frontmatter from 22 portable references.
- Made research and progress notes conditional on repository conventions.
- Removed the instruction that prevented the delivery skill from implementing
  multi-surface work.
- Recast delivery.md as a mode-neutral protocol.
- Added explicit failed versus blocked verdicts.
- Added verification-target authority checks for production, shared, paid, and
  externally visible side effects.
- Added operational refactor and release playbooks.
- Added contents maps to long references where the root heading was directly
  discoverable.

## Gate

Accepted because the edits remove direct instruction conflicts while preserving
standalone capability. No skill behavior depends on Copilot-only tool names or
mandatory bookkeeping after this iteration.

The UI references remain too large and repetitive. That candidate is deferred
until renderer-specific fixture cases can measure whether compression loses
important behavior.
