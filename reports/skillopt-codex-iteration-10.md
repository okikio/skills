# Codex SkillOpt-style iteration 10

## Scope

This iteration repaired the evaluation and optimization harness before accepting more skill prose. The goal was to prevent a large reference corpus from producing false confidence through keyword graders, frozen-set leakage, mutable companion context, or incomparable baseline and candidate runs.

No Markdown formatter was run. Existing Markdown layout was preserved, and the formatter configuration explicitly excludes `**/*.md`.

## Defects found

- The optimizer export contract did not prove that non-target references and companion skills remained unchanged.
- Reference optimization could proceed without both train and seen-validation coverage.
- Release export could silently produce an empty frozen bundle.
- Composition cases did not consistently declare the complete installed-skill topology.
- Several cases described repository behavior but used only lexical assertions.
- Baseline and candidate reports could be mislabeled or compared against the same skill revision.
- Source records named uploaded archives without recomputing their hashes and claim paths.
- Raw case totals mixed executable outcomes, rubric-defined trajectories, and routing smoke tests.

## Accepted harness changes

- Added explicit capability records joining sources, owning skills, routed references, decision questions, failure signatures, exclusions, verification, and eval IDs.
- Restricted a reference optimization workspace to one mutable reference and made every other candidate and companion file immutable.
- Added per-file SHA-256 digests and a verifier that rejects changed, deleted, or unregistered skill files.
- Made evaluate and release workspaces completely immutable.
- Required train and valid-seen coverage for every capability reference optimization.
- Required non-empty frozen exports and at least two skill-owned frozen cases per skill.
- Added explicit expected and forbidden skill topology for composition selection.
- Separated executable, rubric-defined, routing-smoke, and frozen counts in validation output.
- Required benchmark identity, baseline/candidate role, distinct variant identity, distinct target-skill revisions, and paired model/harness/case topology at the candidate gate.
- Preserved a valid no-skill baseline while requiring the candidate to install the target skill.
- Added attachment SHA-256 and ZIP claim-path verification for the retained evidence.

## Result

The harness now validates optimization boundaries and comparison identity. It still does not contain an authenticated rollout and judge runner, so this iteration makes no numerical performance claim. Rubric-defined cases remain test definitions until executed against recorded model trajectories.
