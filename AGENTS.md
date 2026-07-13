# Repository instructions

Treat `skills/*/SKILL.md` and their references as production agent behavior. Do
not optimize wording without measuring behavior.

- Preserve the portable Agent Skills contract.
- Define all structured data with Zod v4 schemas and infer TypeScript types.
- Keep general delivery policy in `deliver-software`; keep Deno-specific
  contracts in `deno-software`.
- Add or update eval cases for every behavioral rule or material reference
  change.
- Never train on frozen test cases.
- Never promote SkillOpt output automatically.
- Separate reference-only freshness updates from behavioral changes.
- Record checks actually run; never imply unavailable model runs passed.
