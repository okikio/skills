# Codex SkillOpt-style iteration 7

## Scope

This iteration repaired the evaluator utilities, schemas, export contract, and
acceptance gate so a future rollout adapter can measure installable skills rather
than concatenated prose. It exported only non-frozen training and
seen-validation cases to candidate-facing workspaces and kept unseen,
adversarial, transfer, and frozen cases evaluator-owned. It did not add or run a
model rollout adapter or aggregate-result producer.

## Harness failures found

- Activation and result schemas only understood the original two skills.
- Candidate exports flattened references into a monolithic context.
- Frozen cases could leak into candidate-facing workflows.
- Assertions lacked file-change, stdout, and stderr behavior checks.
- Results did not record enough model, adapter, skill, reference, command, diff,
  fixture, or pairing provenance.
- Aggregate gates could compare materially different runs.

## Accepted changes

- Generalized skill identifiers, expected and forbidden activation, installed
  and activated skill telemetry, revisions, and reference reads.
- Preserved each candidate and companion skill as a complete directory while
  keeping references individually loadable.
- Added separate optimize, evaluate, and release export modes.
- Added strict aggregate pairing and protected task-success, safety,
  composition, artifact, verification, hallucination, Markdown-preservation,
  and efficiency metrics, with frozen scores restricted to release reports.
- Added reusable fixture-isolation, path-protection, redaction, timeout, and
  assertion utilities for a future rollout adapter.
- Added ten new executable fixtures and source-grounded behavioral cases.

## Verification

- Schema, exporter, fixture-isolation, assertion, redaction, and gate tests pass.
- Optimize exports contain only train and seen-validation cases.
- Evaluation exports contain only unseen, transfer, and adversarial cases.
- Release exports contain only frozen cases.
- References remain selective; no generated `context.md` is used.

## Rejected claims

- A keyword match is not treated as repository task success.
- A structural validation pass is not treated as model-performance evidence.
- Frozen-case scores are not available to the candidate optimizer.
- The presence of evaluator utilities is not described as an executed rollout.
