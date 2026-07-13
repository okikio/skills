# Codex SkillOpt-style iteration 6

## Scope

This iteration replaced the shallow domain skills with evidence-oriented
decision systems. Three independent subagents reviewed the CLI documents and
implementation, web/site/application archives, and API/workflow/data/library
archives. No external model rollout was performed.

## Failure clusters

- Package catalogs named tools but did not teach ownership, applicability,
  failure signatures, version boundaries, or executable verification.
- The original web skill collapsed content sites, product applications, and an
  unsupported browser-extension assumption into one path.
- The CLI skill did not distinguish normative guidebook claims from observed
  implementation or executable behavior.
- API, workflow, and data guidance treated source presence as capability proof.
- Personal-library guidance relied too heavily on remembered package names and
  could invent missing exports.
- Broad Markdown formatting could destroy reviewable authorship without changing
  semantics.

## Accepted changes

- Rebuilt `explore-ecosystems` around evidence, topology, materiality,
  capability ownership, exclusions, integration, and stopping conditions.
- Rebuilt `build-clis` around a public-surface trace and eleven focused
  references derived from the guidebooks and Kaiju implementation failures.
- Split shared web contracts from `build-sites` and `build-web-apps` ownership.
- Rebuilt API, workflow, data, developer-tool, and Okikio skills around observed
  boundaries and counterexamples.
- Added source provenance with duplicate-archive and experimental-status
  records.
- Added a repository rule and formatter exclusion protecting authored Markdown.

## Rejected changes

- Treating every dependency as factually verified to be a monorepo.
- Inferring browser-extension guidance from the `kaiju-site-scope` name.
- Presenting the Solid motion prototype as production-ready gesture support.
- Treating the old and new finance archives as evidence of evolution when their
  relative paths and content hashes are identical.
- Copying package APIs from memory when attached source disagrees.

## Evidence boundary

The accepted changes improve specificity and retrieval design. They do not by
themselves prove a task-success improvement. That claim remains gated on paired
rollouts with executable fixtures and held-out cases.
