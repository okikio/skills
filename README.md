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
- `build-clis` owns command language, configuration, output, interaction,
  cancellation, installed artifacts, and CLI verification.
- `build-web` classifies hybrid web surfaces and owns shared renderer,
  component, motion, security, and browser contracts.
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
`deliver-software` owns the general delivery lifecycle. Domain skills own their
contracts. `explore-ecosystems` owns dependency topology and evidence. A
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

## Quality model

The repository evaluates five distinct capabilities:

1. discovery: whether the correct skill is selected;
2. routing: whether the skill loads only applicable references;
3. application: whether required behavior appears in the trajectory;
4. outcome: whether the resulting repository or answer passes its verifier;
5. efficiency: token, reference, tool-call, latency, and duplication cost.

Results must compare no-skill, individual-skill, and composed-skill variants.
An optimized candidate is never promoted solely because an LLM judge prefers
its prose.

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
and frozen composition topology. It proves selection and immutability boundaries;
it does not substitute for model rollouts or behavioral judging.

Cross-model execution still requires implementing the rollout adapter described
in `skillopt/benchmark-contract.md` and enabling provider commands from
`evals/models.json`. Credentials must remain in the environment and never enter
fixtures, traces, or reports.

SkillOpt is kept as a separately reproducible optimization layer. See
`skillopt/README.md`. Generated candidates are review artifacts, not source
files, until they pass held-out, cross-model, composition, and safety gates.
