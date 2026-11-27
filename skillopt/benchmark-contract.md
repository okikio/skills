# Repository benchmark contract

Each SkillOpt case provides a prompt, optional repository fixture, required and
forbidden routing behavior, deterministic assertions, and an optional
qualitative rubric.

An ownership migration can add an explicit `interpretation` with
`schemaVersion: 1`, `kind: "skill-owner-migration"`, `legacyOwner` and
`currentOwner`. The current owner must be positively expected, and the legacy
owner must be absent from routing expectations. This records a name and
ownership change while preserving the original prompt, assertions and rubric.
It does not supply new acceptance criteria. An unannotated case keeps its
original prompt without inferred aliases.

## Exported workspace

The exported workspace contains:

- `candidate/skills/<target>/SKILL.md`: the trainable document during a
  root-router pass and immutable context during a reference pass;
- `candidate/skills/<target>/references/`: selectively loaded candidate context;
  immutable during a root-router pass, with exactly one selected file mutable
  during an individual-reference pass;
- `candidate/skills/<target>/references/shared/`: materialized shared guides,
  references, handbook documents and their linked assets;
- `candidate/skills/<target>/bundle.json`: source-to-install provenance and
  per-file digests; supporting documents at the skill root are also retained;
- `companions/skills/<skill>/`: immutable companion skill trees selected with
  `--with`;
- `workspace.json`: target, companions, mutable/immutable paths, skill and case
  digests, per-file immutable digests, and the exact case set;
- `data/*.jsonl`: only the splits permitted by the selected export mode.

`verifyWorkspace()` treats the skill trees **and evaluation data** as one export.
It recomputes per-file immutable digests, companion revisions, every JSONL case
digest and the complete case-set digest. Evaluation and release also require an
exact target revision. Optimize mode permits its one declared mutable file to
differ while retaining the original target revision as provenance. A workspace does not pass
because its skill Markdown is unchanged while its held-out cases were edited.

Skill revisions identify the actual installed bytes after Markdown links are
relocated. Shared dependency bytes participate in that identity. Each companion
has its own complete revision and immutable files. A target rollout receives a
fresh copy, so mutations cannot change another rollout's installed dependencies.
Symbolic entries fail integrity scans instead of disappearing from the digest.

`--candidate-workspace` selects a verified optimize input for an evaluate or
release export. Its target, optimization unit, reference and companions must
match the requested topology. The exporter copies that candidate and its
immutable dependencies, validates installed local links, refreshes the changed
file's installed digest in bundle provenance and pins the complete new revision.
It keeps original source digests. Candidate selection rejects other workspace
modes before reading their case data, so frozen data cannot become a training
input through this option.

Capability completeness uses canonical authored paths. A shared source has one
capability owner even when it is copied into many skills. A case refers to the
copy in its selected skill, such as
`prepare-pull-requests/references/shared/references/diagrams.md`. Reading that
document does not require activating its capability owner's skill. Each
capability's own `evalIds` must still require its exact installed reference and
provide train, seen and held-out evidence.

Optimize mode exposes train and valid-seen. Evaluate mode exposes valid-unseen,
transfer, and adversarial cases. Release mode exposes only test-frozen. Never
merge the release export into optimizer or candidate-reflection workspaces.

## Rollout contract

`skillopt:rollout` owns provider-independent rollout mechanics. The configured
provider adapter must install or expose the selected skill directories as real
skills, let the agent select references normally, and return normalized
telemetry defined in `adapter-contract.md`. It must not concatenate every
reference into the prompt.

The repository runner must:

1. create fresh copies of the pinned fixture and installed skill trees;
2. retain the exported workspace manifest and verify skill/case integrity;
3. invoke the target provider with the normalized rollout request;
4. validate target model, adapter, activated-skill, and reference telemetry;
5. run deterministic assertions before any qualitative judge;
6. for `trajectory-rubric` and `mixed` cases, send only redacted trajectory
   evidence and rubric criteria to the explicitly selected judge adapter;
7. require exactly one qualitative result for each rubric index and never let a
   judge override a failed deterministic acceptance check;
8. compute file changes, fixture digests, target latency, judge latency, and
   deterministic/qualitative scores separately;
9. redact configured target and judge secrets before persisted results/traces;
10. record case, corpus, skill, target model/adapter, judge model/adapter, seed,
    and repetition identity;
11. destroy disposable fixture, skill, and protocol directories without hiding
    a primary rollout error behind cleanup failure;
12. verify the exported workspace again after provider processes exit.

The provider adapter owns provider-specific skill exposure, model invocation,
sandboxing, and provider-observable telemetry. It must not guess activation or
reference-read events that the provider cannot prove.

For an annotated case, the runner appends a deterministic versioned ownership
note to the original prompt. Both target and judge receive this effective prompt
through the existing required `prompt` field. The target receives no rubric or
assertion text. The judge receives the original criteria with the same ownership
context. No additional adapter protocol field or version is required.

`--without-target` creates a genuine no-skill variant: the target skill is not
present in the disposable installation root and is omitted from the provider
request. Exported companions remain installed. The normalized result still
records `targetSkill` as the benchmark subject so reports can compare the same
case set across topologies.

## Report contract

`skillopt:report` accepts complete normalized result sets. It does not read a
mutable canonical case file to reinterpret an old run. Each result must match an
exact case digest and the exact workspace case-set digest from which it ran.

Exported JSONL retains the original case text and interpretation metadata. Both
contribute to the parsed case and case-set digests. Removing or changing
the interpretation invalidates that export and results from its prior identity.
The trace records the interpretation, original prompt, effective prompt, each
prompt's SHA-256 digest, and the original rubric. Provider request readback also
checks that the serialized effective prompt was not modified during invocation.
Reports continue to use the pinned exported case identity; they do not infer a
new owner from current source files or rewrite historical scores.

An evaluate report requires exactly one evaluate workspace. A release report
requires exactly one evaluate workspace plus one release workspace with the same
target skill, optimization unit, selected target reference, companions, and skill
revisions. This is necessary because the release
workspace intentionally exposes only frozen cases while a release promotion
still needs its previously held-out valid-unseen/adversarial evidence.

Every case in a report must have the same exact `(seed, repetition)` matrix and
must appear once for every run key. Missing, duplicate, or extra results make the
report invalid. Model identity, adapter version, variant identity, installed
skill topology, and installed revisions must also be constant within a report.

### Score/rate metrics

Every scalar quality metric is stored as:

```json
{
  "value": 0.92,
  "samples": 24
}
```

The sample count is part of the contract. A metric with no applicable source
cases is omitted rather than represented as `0` or `1`.

| Metric | Exact derivation | Direction |
| --- | --- | --- |
| `taskSuccess` | Fraction of normalized results whose complete acceptance contract passed. | higher |
| `invalidRun` | Fraction with provider, judge, telemetry, workspace-integrity, or cleanup error. | **must be 0** |
| `validUnseen` | Mean normalized `result.score` for `split=valid-unseen`. | higher |
| `transfer` | Mean score for `split=transfer`. | higher |
| `adversarial` | Mean score for `split=adversarial`. | higher |
| `composition` | Mean score for `kind=composition`. | higher |
| `safety` | Mean score for `kind=safety`. | higher |
| `frozen` | Mean score for `split=test-frozen`; release reports only. | higher |
| `artifact` | Mean score for `kind=artifact`. | higher |
| `fixture` | Complete-result pass rate for cases with a concrete fixture. | higher |
| `hallucination` | Complete-result **failure** rate for cases tagged `anti-hallucination`. | lower |
| `markdownPreservation` | Complete-result pass rate for cases tagged `markdown`. | higher |
| `verification` | Complete-result pass rate for cases tagged `verification`. | higher |

`prohibitedOutcome` is intentionally narrower than a generic “forbidden action”
heuristic. Its denominator contains only authored negative expectations:

- one observation for each `forbiddenSkills` entry;
- one observation for each `forbiddenReferences` entry;
- one observation for each `not-contains`, `file-not-exists`, or
  `file-unchanged` deterministic assertion.

The numerator counts those expectations that were violated. Tool-call text is
not scanned to invent additional prohibited actions.

### Routing metrics

Activation and reference selection use micro-averaged precision/recall over the
exact case expectations:

```text
true positive   observed value that is expected/required
false positive  observed value not expected/required
false negative  expected/required value not observed

precision = TP / (TP + FP)
recall    = TP / (TP + FN)
```

When no positive value is observed, precision is `1` because there is no false
positive selection; missing expected values are still penalized through recall.
When the suite contains no expected values, recall is `1`.

Reference precision therefore measures selective loading. Reading a reference
that the exact case did not require counts as additional context even when it
would be reasonable in another case.

### Cost metrics

Runtime/cost measurements are separate from quality scores and retain their own
sample counts:

- target duration;
- judge duration;
- target tool calls and commands;
- target output characters;
- target input/output tokens when the provider reports them;
- judge input/output tokens when the judge reports them;
- changed-file count and added/deleted line counts;
- complete file bytes in the installed target skill tree.

Optional token means use only concrete provider observations. Missing token
telemetry is not converted to zero. Target-skill bytes are zero only for a real
no-skill variant.

## Paired candidate gate

Baseline and candidate reports use one `benchmarkId` and must pair on:

- phase;
- target skill, optimization unit, and selected target reference;
- target provider ID, host, actual model/version, and adapter version;
- configured judge and actual judge identity/version when qualitative cases are
  present;
- git revision;
- companion-skill names **and revisions**;
- exact case-set digest and case IDs;
- exact seed/repetition run keys and run count;
- metric-family availability and source sample counts.

Their `variantRole`, `variantId`, and target topology/revision must differ. The
candidate must install the target skill. The baseline can omit the target skill,
install a current skill, or install a released skill.

A gate rejects either report when `invalidRun.value` is non-zero. It then
requires non-regressing task success and valid-unseen score, at least one strict
improvement unless `--allow-equal` is explicit, and no regression in any paired
protected metric family. Release gates additionally protect frozen score.

By default each case needs at least three run keys. `--allow-single-run` is for
explicit smoke/debug use only.

Artifact-size regression is comparable only when the baseline also installs a
target skill. In that case the candidate target tree must remain within 110% of
the baseline bytes unless `--allow-longer` is explicit. A no-skill baseline is
useful for efficacy but cannot establish a meaningful skill-size regression;
the gate reports `sizeComparable=false` instead of fabricating a denominator.
