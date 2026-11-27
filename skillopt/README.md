# SkillOpt integration

SkillOpt optimizes generated candidates, never the canonical skill in place.
The repository owns export, workspace integrity, normalized rollout execution,
deterministic assertions, qualitative judging, aggregate reports, and candidate
gating. Model hosts connect through the provider-neutral protocol in
[`adapter-contract.md`](./adapter-contract.md).

## Authored guidance and installed skills

The collection keeps one authored copy of each shared guide, reference and
handbook document. `deno task bundle --out .dist/skills` builds independent
skill folders from those sources. Add `--skill build-clis` to build one skill,
or `--ref <git-ref>` to pin optional companion links to a branch or commit.

`skillopt:export` uses the same materializer. Shared files appear below
`references/shared/` inside each installed skill. Source-relative Markdown
links are rewritten to those installed locations. Code examples stay literal.
Links to other skills become public source URLs with named optional companions;
they do not install another skill. Use `--with` when a benchmark requires a
companion to be installed.

Exported cases must fit that explicit installation. Every positive
`expectedSkills` entry and every skill prefix in `requiredReferences` must be present,
whether the case names the target directly or is a composition case. Composition
cases also require their forbidden skills to be installed so the routing choice
can be observed. A primary case may forbid an absent skill. Add the required
companions with `--with` to include cases that depend on them.

After this selection, both root and reference optimization require train and
valid-seen cases. Evaluation requires at least one eligible held-out case;
release requires at least one eligible frozen case. An empty selection fails
before replacing the previous workspace. A paired `--without-target` rollout
uses the same exported cases and omits the target only at execution time.

Each generated `bundle.json` records the canonical source path, source digest
and installed digest for every file. Workspace `skillRevisions` hash the complete
generated skill, including this manifest. A change to a shared dependency
therefore changes the revision of every bundle that includes it. The source
checkout is not needed at rollout time.

## Optimization flow

1. Run `deno task skillopt:export --skill deno-software --mode optimize`.
   Add immutable companions with repeated `--with` flags.
2. For an individual-reference pass, add exactly one path such as
   `--reference references/optique.md` for `build-clis`,
   `--reference references/shared/guides/engineering-standards.md` when that
   guide has cases for the selected skill, or `--reference cli.md` for `shadcn`.
   The path is relative to the installed skill. The root router and every other
   file remain immutable.
3. Install Microsoft SkillOpt in an isolated Python environment from a pinned
   release.
4. Train only with train and valid-seen data.
5. Export the best candidate under `.skillopt/<skill>/optimize/candidate/`.
6. Run `deno task skillopt:verify --workspace
   .skillopt/<skill>/optimize/workspace.json` after every optimizer process.
   The one declared mutable file may change. Immutable dependencies, companion
   revisions and exported case data must still match. The original target
   revision remains provenance for that optimization input.
7. Export the edited candidate with `--mode evaluate --candidate-workspace
   .skillopt/<skill>/optimize/workspace.json`. Repeat the same `--skill`,
   `--reference` and `--with` choices used by the optimize export. This command
   verifies the input, copies its pinned dependencies, checks installed links
   and records the candidate's actual bytes as a new immutable revision.
   The held-out export contains valid-unseen, transfer and adversarial cases.
8. Roll out the baseline and candidate over the **same exact case/run matrix**.
   Retain their workspaces separately before exporting the next variant into
   the default output directory.
   Qualitative cases require an explicit `--judge` adapter. Use
   `--without-target` for a real no-skill baseline instead of hiding the target
   from telemetry after it was installed.
9. Build one aggregate report per variant with `skillopt:report`. An evaluate
   report consumes the evaluate workspace. A release report consumes both the
   same evaluate workspace and the frozen release workspace so it retains
   held-out and frozen evidence in one artifact. Those workspaces must preserve
   the same optimization unit and selected target reference.
10. Use `skillopt:gate` on paired baseline/candidate reports. A benchmark with
    provider, judge, telemetry, or integrity-invalid runs is not eligible for
    promotion even if its average model score improved.
11. Create the frozen release workspace with `--mode release` and the same
    `--candidate-workspace` input used for evaluation. Candidate selection accepts
    only an optimize workspace and checks that mode before reading its case data.
    Keep the frozen export out of optimizer prompts, candidate reflection and
    training failure reports.
12. Review and port accepted edits manually with their supporting eval changes.

## Rollout execution

`skillopt:rollout` consumes one exported workspace, one exported case, and one
enabled target entry from `evals/models.json`. A qualitative case also consumes
one explicitly selected judge entry:

```sh
deno task skillopt:rollout \
  --workspace .skillopt/deno-software/evaluate/workspace.json \
  --case deno-library-artifact-valid-unseen \
  --model codex-default \
  --judge claude-default \
  --variant candidate-a \
  --seed 7 \
  --repetition 0 \
  --out .skillopt/runs/candidate-a/deno-library-artifact-valid-unseen/7-0
```

A no-skill baseline uses the same workspace, model, case, judge, seed, and
repetition but deliberately omits the target skill:

```sh
deno task skillopt:rollout \
  --workspace .skillopt/deno-software/evaluate/workspace.json \
  --case deno-library-artifact-valid-unseen \
  --model codex-default \
  --judge claude-default \
  --variant no-skill \
  --without-target \
  --seed 7 \
  --repetition 0 \
  --out .skillopt/runs/no-skill/deno-library-artifact-valid-unseen/7-0
```

The repository runner:

- verifies immutable skill files, skill revisions, and exported cases before the
  rollout;
- copies the selected skill topology to a disposable installation root;
- copies the fixture into independent working and hidden baseline directories;
- writes a `RolloutRequestSchema` document without assertions or rubrics;
- invokes the configured provider adapter with an explicit environment
  allowlist;
- validates provider telemetry and reported skill/reference identities;
- runs deterministic assertions before any qualitative judge;
- computes fixture digests, changed files, and bounded line-change metrics;
- invokes the explicit judge only for `trajectory-rubric` and `mixed` cases;
- redacts target evidence before judging and both providers' configured secrets
  before persistence;
- verifies the exported workspace again after provider execution;
- writes one normalized `EvalResultSchema` and one structured redacted trace.

Provider adapters own only provider-specific skill installation, model
invocation, sandboxing, and telemetry translation. See
[`adapter-contract.md`](./adapter-contract.md) for the exact request and response
contract.

All built-in provider entries remain disabled until the corresponding external
version-2 adapter is installed and verified. Each adapter declares whether it
supports target `rollout` requests, qualitative `judge` requests, or both. If a
provider cannot report actual skill activation or reference reads, keep it
disabled for routing/reference-efficiency benchmarks rather than manufacturing
telemetry.

## Aggregate reports

`skillopt:report` consumes **only normalized `result.json` files** and verified
exported workspace data. It fails when results cover only part of the exported
case set, when cases use different seed/repetition matrices, or when model,
variant, skill-topology, revision, case, or corpus identities are mixed.

An evaluate report uses exactly one evaluate workspace:

```sh
deno task skillopt:report \
  --workspace .skillopt/deno-software/evaluate/workspace.json \
  --results .skillopt/runs/candidate-a \
  --benchmark deno-software-2026-08-19 \
  --git-revision "$GIT_REVISION" \
  --variant-role candidate \
  --out .skillopt/reports/candidate-a.evaluate.json
```

A release report uses exactly one evaluate workspace and one frozen release
workspace. Both exports must contain the same target/companion revisions:

```sh
deno task skillopt:report \
  --workspace .skillopt/deno-software/evaluate/workspace.json \
  --workspace .skillopt/deno-software/release/workspace.json \
  --results .skillopt/runs/candidate-a-release \
  --benchmark deno-software-2026-08-19 \
  --git-revision "$GIT_REVISION" \
  --variant-role candidate \
  --out .skillopt/reports/candidate-a.release.json
```

Metrics retain their sample counts. Optional metric families stay absent when
no source case supports them; the reporter never fabricates a zero or perfect
score. Target-model runtime, judge runtime, token telemetry, tool/command counts,
file changes, and target-skill byte size remain in the separate `cost` object.
See [`benchmark-contract.md`](./benchmark-contract.md) for exact metric
semantics.

Pair the reports only after their benchmark, model, judge, companion revision,
case, and run identities match:

```sh
deno task skillopt:gate \
  --baseline .skillopt/reports/baseline.evaluate.json \
  --candidate .skillopt/reports/candidate-a.evaluate.json
```

At least three run keys per case are required by default. Use
`--allow-single-run` only for an explicit smoke/debug comparison. A no-skill
baseline cannot establish target-skill size regression, so the gate reports
size as non-comparable. Use a current/released-skill baseline when artifact-size
regression is part of the promotion decision.

## Candidate integrity

The optimizer may add, replace, or delete procedural text only in the path
listed by `mutablePaths`. Protected material includes frontmatter, security
rules, source citations, frozen-test isolation, cross-skill ownership, and the
rule against claiming checks that did not run.

The exporter materializes the target and each explicitly selected companion as
separate, self-contained directories. References remain separate files for
selective loading and reference-efficiency measurement. Only
the target skill's `SKILL.md` is mutable during a root-router optimization pass.
A reference pass makes exactly one selected reference mutable. Every other
candidate file and all companion paths remain immutable. Evaluate and release
workspaces have no mutable paths.

`immutablePaths` is not a sandbox by itself. The rollout harness retains the
trusted exported manifest and rechecks file digests, skill revisions, and case
data after provider processes exit. The provider adapter or its host must still
enforce the OS/process sandbox that prevents a model from accessing files
outside the disposable fixture and skill installation roots.

Run `deno task skillopt:matrix` before release to prove that every registered
capability reference, root router, and frozen composition topology can be
exported and that every resulting workspace passes the integrity verifier.
The matrix runs at most four skill lanes at once, keeps each skill's exports
sequential and finishes the reference, root and frozen-composition phases in
order. Each frozen composition topology is exported once per distinct positively
expected target, retaining the other topology members as companions. This checks
both positive orientations when cases share an installation but route differently.

Source validation follows real Markdown links from each entrypoint, including
resource indexes. Every operational source needs a capability owner with
source-grounded train, seen and held-out cases. Generated shared copies inherit
their single source owner's coverage; they do not create duplicate capabilities.
Vendored rule examples, templates, assets and source snapshots remain supporting
material. A broken required local link or symbolic source fails the build.
