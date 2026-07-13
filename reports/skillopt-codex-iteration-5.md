# Codex SkillOpt-style iteration 5

## Scope

This iteration used three independent audits: uploaded-repository preservation,
skill architecture, and evaluation/harness integrity. It did not run external
model rollouts and makes no pass-rate claim.

## Accepted changes

- Added the ecosystem hypothesis as an evidence-seeking rule rather than the
  false assertion that every package is literally a monorepo.
- Added eight progressively disclosed skills covering ecosystem research, CLI,
  web, API, workflow, data, developer-tool, and Okikio work.
- Preserved all six user-modified delivery references unchanged.
- Generalized the skill-name schema and validator count.
- Added 12 non-duplicated ecosystem and composition cases.
- Removed frozen cases from optimizer exports and preserved installable skill
  directories in exported workspaces.
- Fixed the missing assertion type and declared test permissions.

## Rejected changes

- One skill per package: rejected because activation overlap and freshness cost
  would be excessive.
- Installing every sibling found: rejected because ecosystem discovery informs
  selection rather than mandating adoption.
- Claiming cross-model improvement: rejected because no external rollout ran.

## Remaining harness work

The repository still needs a real rollout runner, paired trajectory gate,
generic per-skill activation telemetry, evaluator-owned held-out export, and
stronger command sandboxing before SkillOpt scores can support release claims.
