# okikio/skills

Evaluation-backed software engineering skills for Agent Skills-compatible
agents.

## Skills

- `deliver-software` carries substantial software work from repository
  discovery through implementation, cleanup, validation, and executable
  verification.
- `deno-software` adds current Deno-specific repository, dependency,
  compatibility, security, quality, publication, and artifact guidance.
- `explore-ecosystems` gives every in-scope dependency a cheap ecosystem identity
  check, then verifies monorepos, siblings, adapters, plugins, specifications,
  alternatives, and exclusions deeply for material decisions.
- `build-libraries` owns reusable programming models, public APIs, selective
  adoption, data-flow shapes, explicit resource ownership, data-oriented hot
  paths, library performance, packaging contracts, and restart/resume contracts.
- `build-clis` owns command language, configuration, output, interaction,
  cancellation, installed artifacts, and CLI verification.
- `build-web` classifies hybrid web surfaces and owns renderer, component,
  motion, security, and browser contracts used across those surfaces.
- `build-sites` owns Astro content, marketing, documentation, CMS, feeds, and
  static/server site delivery.
- `build-web-apps` owns stateful Solid and TanStack applications, URL/query/local
  state, sessions, authorization, and product interaction.
- `build-apis` owns service-module, endpoint, validation, response, middleware,
  authentication, authorization, and request contracts.
- `build-workflows` owns durable coordination, workers, queues, timers, signals,
  checkpoints, recovery, and resumable pipelines.
- `build-data` owns operational, analytical, search, graph, artifact, query,
  migration, and projection contracts.
- `build-devtools` owns toolchains, generators, packaging, releases, performance
  experiments, and repository hygiene.
- `use-okikio` provides source-grounded playbooks for Okikio libraries and
  recurring project patterns without inventing private exports.

The skills are independently installable and deliberately composable.
`deliver-software` owns the general delivery lifecycle and the current
cross-project engineering standards for naming, schema/type contracts,
TSDoc/comments, documentation, formatting, resource ownership, and completion.
Domain skills own their contracts. `explore-ecosystems` owns dependency topology
and evidence. A
composed task performs one repository discovery pass, one plan, and one final
verdict.

## Install

```sh
npx skills add okikio/skills
```

For a version-pinned GitHub CLI installation:

```sh
gh skill install okikio/skills deliver-software@v1.0.0
gh skill install okikio/skills deno-software@v1.0.0
```

## Skill completion contract

A skill is not complete because it has a `SKILL.md`, references, or a pair
of frozen routing cases. Every shipped operational reference must be:

1. explicitly routed from the owning `SKILL.md`;
2. represented in `evals/capabilities.json`;
3. grounded in at least one registered evidence source;
4. covered by train and valid-seen cases;
5. covered by at least one held-out split (`valid-unseen`, `transfer`, `adversarial`, or `test-frozen`);
6. connected to decision questions, failure signatures, exclusions, and
   verification instructions.

`deno task validate` enforces this reference-to-capability coverage. This
prevents a large reference library from looking complete while the agent
behavior remains unevaluated.

## Quality model

The repository evaluates five distinct capabilities:

1. discovery: whether the correct skill is selected;
2. routing: whether the skill loads only applicable references;
3. application: whether required behavior appears in the trajectory;
4. outcome: whether the resulting repository or answer passes its verifier;
5. efficiency: token, reference, tool-call, latency, and duplication cost.

Results can compare real no-skill, individual-skill, and composed-skill variants.
A no-skill rollout omits the target skill from the installation rather than only
hiding its telemetry. An optimized candidate is never promoted solely because a
qualitative judge prefers its prose. Deterministic acceptance criteria remain
authoritative, and provider/judge/integrity-invalid runs are not treated as
ordinary task failures.

## Development

Install Deno 2, then run:

```sh
deno task validate
deno task check
deno task test
deno task skillopt:matrix
deno task sources:verify --attachments /path/to/uploaded-evidence
```

The optional source check recomputes the registered SHA-256 values for the
uploaded guidebooks and archives and verifies every registered ZIP claim path.
`evals/capabilities.json` then connects those
sources to routed references and behavioral cases, so a tool name by itself is
not treated as verified coverage.

`skillopt:matrix` exports and verifies every capability reference, root router,
and frozen composition topology. It proves selection and immutability contracts;
it does not substitute for model rollouts or behavioral judging.

Cross-model execution uses `deno task skillopt:rollout`. The repository runner
owns fixture isolation, deterministic assertions, qualitative-judge ordering,
redaction, change accounting, and workspace integrity. `trajectory-rubric` and
`mixed` cases require an explicit `--judge` adapter; target models never receive
rubric criteria, and judges never receive fixture or skill-tree paths. Use
`--without-target` for an actual no-skill baseline. After the exact case/run
matrix completes, `deno task skillopt:report` creates a sample-counted aggregate
report from verified exported cases and normalized `result.json` files.
`deno task skillopt:gate` compares paired reports and rejects invalid benchmark
runs before comparing model quality. Provider-specific integrations implement
the versioned JSON protocol in `skillopt/adapter-contract.md`; enable only
adapters that can truthfully report the telemetry required by their declared
request kinds. Credentials remain in explicitly allowed environment variables
and never enter fixtures or skill files.

SkillOpt is kept as a separately reproducible optimization layer. See
`skillopt/README.md`. Generated candidates are review artifacts, not source
files, until they pass held-out, cross-model, composition, and safety gates.
