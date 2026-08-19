# Repository instructions

Treat `skills/*/SKILL.md` and their references as production agent behavior.
Do not optimize wording without measuring behavior.

- Preserve the portable Agent Skills contract.
- Never run a broad formatter over Markdown. Preserve existing prose wrapping,
  spacing, and code-block layout. Make Markdown changes with narrow patches that
  keep unrelated lines byte-stable.
  Formatting tables is fine.
- Use Zod v4 for first-party executable data contracts and infer project-owned
  data types from schemas. Use Standard Schema when a reusable integration needs
  validator interoperability. Standard JSON Schema is a separate JSON Schema
  representation contract.
- Keep general delivery policy in `deliver-software`; keep Deno-specific
  contracts in `deno-software`.
- Treat `skills/deliver-software/references/base.md` as the current cross-project
  engineering baseline. Newer repository-specific instructions may narrow it;
  historical handoffs do not silently override it.
- Prefer `node:test` with `@std/expect` for Deno-first TypeScript package tests
  unless the target repository deliberately uses another runner.
- Do not preserve obsolete compatibility by default. A replacement must update
  current consumers, tests, exports, docs, config, persisted data, and user flows
  before the obsolete path is removed.
- Avoid generic architecture nouns in project-owned guidance. Name the specific
  concept, such as an API entrypoint, validation stage, transaction commit,
  ownership handoff, version line, or materialization point.
- Add or update eval cases for every behavioral rule or material reference
  change. Every shipped `references/*.md` file must be routed from its `SKILL.md`,
  mapped in `evals/capabilities.json`, grounded in registered sources, and have
  train, valid-seen, and held-out evaluation coverage.
- Use strict Zod objects for repository-owned serialized contracts unless a
  documented external compatibility requirement must preserve unknown keys.
- Treat SkillOpt as one explicit pipeline: export immutable workspaces, run target
  and optional judge adapters, build complete aggregate reports, then gate paired
  baseline/candidate reports. A report must cover the exact exported case/run
  matrix and preserve model, judge, skill-revision, optimization-unit, and target
  reference identity.
- A no-skill SkillOpt baseline omits only the target skill. It must not fabricate a
  target revision or target size, and target-size comparisons are not applicable
  against that baseline.
- Never train on frozen test cases.
- Never promote SkillOpt output automatically.
- Separate reference-only freshness updates from behavioral changes.
- Record checks actually run; never imply unavailable model runs passed.
