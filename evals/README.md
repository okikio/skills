# Evaluation design

The suite defines tasks and evidence for comparing guidance. Registered cases,
valid metadata and passing packaging checks do not establish that a model has
completed those tasks. Claims of marginal skill utility require comparable
no-skill, individual-skill and composed-skill target runs.

`capabilities.json` is the coverage ledger. Each record binds a material
capability to an owning skill, an installed reference, source evidence,
behavioral cases, decision questions, failure signatures, exclusions and a
verification method. A package mention without that chain is not capability
coverage.

## Authored ownership and installed paths

The collection has one authored owner for each operational document. A skill
owns its local references; shared methods live under `guides/`, `references/`
and `handbook/`. The bundle builder copies reachable shared files into
`<skill>/references/shared/` and rewrites their local links. Cases use these
installed paths because they describe what the target can actually read.

For example, the authored `guides/software-quality.md` becomes
`refactor-code/references/shared/guides/software-quality.md` in that skill's
bundle. Another skill may carry the same guide. Both copies resolve to the same
source owner; they do not require duplicate capability records.

Validation checks that every operational document has a capability owner and is
reachable through its owning skill. Each capability's own mapped cases must
include train, valid-seen and held-out behavioral coverage. An evaluation must
require the reference that its capability names. Supporting licenses, attribution,
examples, templates and vendored source catalogs have explicit exclusions from
this operational ledger; their links and installed files still need validation.

The retired `deliver-software` entrypoint has been replaced by focused work
modes and shared references. Historical case IDs remain stable. Their skill and
reference bindings now point to the current owners; the migration preserves the
original prompts, rubrics and split memberships. The expanded portable cases
cover project-independent adoption, declared runtime support, documentation,
handbook procedures and public utility contracts.

## Evidence and split ownership

Routing cases measure activation precision and recall. Knowledge cases exercise
contracts models commonly misremember. Trajectory cases score inspection,
decisions, tool order and honest reporting. Artifact cases use repositories
with executable acceptance checks. Composition cases detect duplicated or
conflicting behavior. Safety cases cover instruction conflicts, secrets,
destructive actions and untrusted repository content.

SkillOpt may read train and valid-seen cases. Candidate selection may use
valid-unseen. Cross-model runs use transfer. Release review uses adversarial and
then test-frozen. Frozen cases never enter optimizer prompts or failure reports.

Deterministic assertions and repository commands run before qualitative judging
and remain authoritative. `trajectory-rubric` and `mixed` cases require an
explicit judge adapter. The judge receives the original prompt, rubric and
redacted target trajectory evidence, without a fixture path, hidden baseline,
mutable skill tree or evaluator answer key. A favorable judge result cannot
override a failed deterministic acceptance criterion.

The nonempty-output assertions in trajectory cases are integrity checks. Their
task-specific rubrics require real target and judge execution. Passing those
assertions alone does not satisfy the scenario.

## Candidate identity and telemetry

Results record generic `installedSkills`, `activatedSkills`, per-skill revisions,
references read, case and corpus digests, model and adapter versions, seed and
repetition. The harness does not encode one boolean per skill. Reading a root
`SKILL.md` is activation telemetry; supporting-reference telemetry names a
separate document.

Installed revision hashes cover the generated skill tree, including copied
shared dependencies. A shared-guide edit therefore changes affected bundle
identities. Optimization allows only the declared mutable file; dependencies,
companions, cases and hidden fixtures remain immutable. Export an edited
optimization workspace with `--candidate-workspace` to create a strictly pinned
evaluation or release workspace. See [the SkillOpt workflow](../skillopt/README.md)
for the commands and data-access constraints.

Baseline and candidate gates require the same benchmark, target, host, model and
adapter versions, companion topology, case set and IDs, seed policy, repetitions
and run count. They require explicit baseline/candidate roles and different
variant and target-skill revisions. A no-skill baseline may omit the target; the
candidate may not. At least three paired repetitions are required by default.

## Corpus use

`core.json` is a routing smoke corpus. Its repeated environment variants measure
activation and basic concept recall, but keyword assertions cannot establish
task success.

Quality, evidence, deep-capability and domain-specific cases form the decision
corpus. They include composition, authorization, negative routing, security,
compatibility and executable proof. Routing-smoke rubric prose is explanatory;
it does not automatically invoke a judge. Release claims must use real
trajectories and executable cases, not raw case totals.

`portable-guidance.json` tests shared methods and focused skills across distinct
project contexts. `public-utils-portability.json` checks source versus release
identity, verified export ownership, query compilation, service mounting and
cleanup. `handbook-portability.json` exercises adopted procedures, project
records, delivery and recovery. A project does not adopt every handbook
procedure merely by installing a skill.

`library-design-deep.json` covers use-case-first architecture, ecosystem
composition, data-flow contracts, resource ownership, performance, selective
package graphs, recovery, refactoring and claim-to-evidence verification. Its
frozen fixtures exercise import-time effects, lazy iteration, early termination,
failure cleanup and deterministic disposal.

`evidence.json` retains the provenance of earlier source-grounded cases. Those
records describe their historical inputs, not universal project requirements.
Fixtures are minimal copies that keep failures attributable and repeatable;
complete source repositories are not mutable acceptance fixtures.
