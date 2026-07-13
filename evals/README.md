# Evaluation design

The suite measures marginal skill utility, not whether an answer sounds good.
Every release compares identical tasks across no-skill, individual-skill, and
composed-skill variants.

Routing cases measure activation precision and recall. Knowledge cases exercise
contracts models commonly misremember. Trajectory cases score inspection,
decisions, tool order, and honest reporting. Artifact cases use repositories
with executable acceptance checks. Composition cases detect duplicated or
conflicting behavior. Safety cases cover instruction conflicts, secrets,
destructive actions, and untrusted repository content.

SkillOpt may read train and valid-seen cases. Candidate selection may use
valid-unseen. Cross-model runs use transfer. Release review uses adversarial and
then test-frozen. Frozen cases never enter optimizer prompts or failure reports.

Deterministic assertions and repository commands control outcome scores. An LLM
judge may grade qualitative rubric items but cannot override failed executable
acceptance criteria.

## Generic skill telemetry

Results record generic `installedSkills`, `activatedSkills`, per-skill
revisions, references read, case/corpus digests, model and adapter versions,
seed, and repetition. The harness must not encode one boolean per skill.

Baseline and candidate gates require the same target, host, model version,
adapter version, installed skills, case set, case IDs, seed policy, repetitions,
and run count. Skill revision is intentionally allowed to differ. At least three
paired repetitions are required by default.

The first-generation `activation.deliverSoftware` and
`activation.denoSoftware` case field remains readable during migration but does
not satisfy telemetry for the new skills. New and materially revised cases use
`expectedSkills` and `forbiddenSkills`.

## Corpus tiers

`core.json` is a broad routing smoke corpus. Its repeated environment variants
measure whether activation and basic concepts survive prompt changes, but its
keyword assertions cannot establish task success.

`quality.json` is the decision corpus. Its cases combine multiple behavioral
assertions with a task-specific rubric and include frozen composition,
authorization, negative-routing, security, compatibility, and executable-proof
scenarios. Release claims must use the decision corpus and real trajectories,
not the smoke corpus alone.

`evidence.json` contains source-grounded cases from the attached guidebooks and
repositories. Its fixture cases cover Markdown preservation, CLI task parity,
single configuration evaluation, result redaction, native site semantics,
web-state ownership, API validation, workflow idempotency, generator drift, and
missing personal-library exports. Full attached repositories are never used as
mutable fixtures; minimal copies keep failures attributable and repeatable.
