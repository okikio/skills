# SkillOpt-style Codex optimization: iteration 4

## Objective

Replace prose-only gates with executable harness foundations.

## Accepted edits

- Export smoke, quality, and fixture corpora instead of core.json alone.
- Added a composition export mode.
- Exported immutable reference context beside the trainable root document.
- Expanded result provenance with host, model, version, seed, tokens, tools,
  commands, references, activation, and diff metrics.
- Expanded the candidate gate with frozen, artifact, activation, reference,
  verification, and forbidden-action metrics.
- Added deterministic text, regex, file, and command assertion execution.
- Added secret redaction and fixture path-escape protection.
- Added disposable fixture copying and isolation tests.
- Added four initial fixture-backed cases for workspace ownership, generated
  refactoring, migration authority, and negative Deno routing.

## Rejected claims

The repository still cannot claim measured recall, pass-rate improvement, or
cross-model transfer. The model runner, host adapters, reference-read capture,
and a balanced routing corpus remain incomplete. The original 100 cases remain a
smoke corpus, not an outcome benchmark.

## Next gate

The next optimization should add balanced positive and negative activation
minimal pairs, more Deno and delivery fixtures, and real no-skill versus
individual versus composed trajectories.
