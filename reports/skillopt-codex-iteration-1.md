# SkillOpt-style Codex optimization: iteration 1

## Scope

This iteration optimized the instruction and retrieval behavior of
`deno-software`, `deliver-software`, and their composition. Codex performed the
target review and optimizer reflection in separated passes within one session.
This is useful evidence for Codex behavior but is not cross-model evidence.

Microsoft SkillOpt v0.2.0 was cloned and installed successfully. Its packaged
training runner was not used for model calls because no supported API credential
or authenticated agent CLI was present. The bounded-edit, held-out-gate method
was reproduced directly.

## Baseline defects

### Deno skill

1. Every substantive Deno task loaded the complete release-history reference,
   even when version history could not affect the decision.
2. The new decision-cases reference was not represented in the routing table.
3. The frontmatter carried conflicting top-level and metadata versions.
4. General delivery stages could be repeated when deliver-software was active.

### Delivery skill

1. Review, diagnosis, planning, implementation, and publication lacked an
   explicit authorization classifier at the root routing layer.
2. Reference loading listed applicable documents but did not require a concrete
   question before loading them.
3. The composition contract named ownership but did not protect against
   reference over-loading.

### Evaluation system

1. The 100-case corpus was mostly five environment variants of 20 prompts.
2. Several cases passed on one keyword, such as JSR or native.
3. Composition had no frozen test cases.
4. Negative routing and external-mutation authorization were underrepresented.

## Accepted bounded edits

1. Removed the conflicting Deno top-level version.
2. Made foundations and repository discovery the ordinary Deno baseline.
3. Made release history conditional on version or stability decisions.
4. Added decision cases to the Deno routing table.
5. Added a stop condition for reference retrieval.
6. Added an authorization-mode table to deliver-software.
7. Added domain-versus-general ownership and one-pass composition rules.
8. Added twelve higher-quality evaluation cases with multi-part assertions and
   rubrics, including three frozen composition cases.

## Rejected edits

- Merging the two skills was rejected because it would reduce independent
  installability and make generic delivery tasks pay Deno context cost.
- Removing the standalone delivery workflow from deno-software was rejected
  because the skill must work when deliver-software is not installed.
- Adding more universal prose was rejected because the observed problem was
  retrieval and application, not raw instruction volume.
- Automatically accepting SkillOpt output was rejected because same-model
  optimization can overfit Codex and the visible cases.

## Gate results

### Structural

- Both skill names still match their directories.
- All newly linked references exist.
- The JSON evaluation files parse.
- The decision corpus contains unique identifiers.
- Git whitespace validation passes.

### Held-out review

The candidate explicitly covers the previously missing decisions in unseen and
adversarial cases:

- npm workspace protocol ownership;
- hybrid framework classification;
- private registry secret handling;
- native-addon platform verification;
- dual publication;
- diagnose-only authorization;
- dirty-worktree preservation;
- validation versus real verification;
- positive and negative skill composition;
- publication without authorization.

This is a rule-coverage gate, not a measured model pass rate. A numeric
improvement claim is intentionally withheld until isolated trajectories run
across Codex and at least one other model family.

## Next iteration

1. Replace remaining smoke-only cases with repository fixtures and executable
   assertions.
2. Run isolated Codex trajectories for no-skill, each skill, and both skills.
3. Run the same frozen cases through Claude, Copilot, Cursor, Pi, and Hermes.
4. Cluster failures into missing rule, wrong rule, retrieval failure, execution
   lapse, tool mismatch, and grader defect.
5. Accept another bounded edit only when unseen behavior improves without
   safety, composition, or efficiency regression.
