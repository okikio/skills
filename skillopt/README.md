# SkillOpt integration

SkillOpt optimizes generated candidates, never the canonical skill in place.
The repository owns export, workspace integrity, normalized rollout execution,
deterministic assertions, qualitative judging, aggregate reports, and candidate
gating. Model hosts connect through the provider-neutral protocol in
[`adapter-contract.md`](./adapter-contract.md).

## Optimization flow

1. Run `deno task skillopt:export --skill deno-software --mode optimize`.
   Add immutable companions with repeated `--with` flags.
2. For an individual-reference pass, add exactly one path such as
   `--reference references/optique.md`. The root router and every other
   reference remain immutable.
3. Install Microsoft SkillOpt in an isolated Python environment from a pinned
   release.
4. Train only with train and valid-seen data.
5. Export the best candidate under `.skillopt/<skill>/optimize/candidate/`.
6. Run `deno task skillopt:verify --workspace
   .skillopt/<skill>/optimize/workspace.json` after every optimizer process.
   Reject a candidate if immutable skill content, skill-tree revisions, or
   exported case data no longer match the manifest.
7. Export a held-out workspace with `--mode evaluate`. It contains
   valid-unseen, transfer, and adversarial cases but never frozen cases.
8. Roll out the baseline and candidate over the **same exact case/run matrix**.
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
11. Create the frozen release workspace only with `--mode release`. Never expose
    it to optimizer prompts, candidate reflection, or failure reports.
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

The exporter preserves the target and companion skill directory trees. It does
not concatenate every reference into one context file because that defeats
selective loading and makes reference efficiency impossible to measure. Only
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
