# okikio/skills

Evaluation-backed software engineering skills for Agent Skills-compatible
agents.

## Skills

- `deliver-software` carries substantial software work from repository discovery
  through implementation, cleanup, validation, and executable verification.
- `deno-software` adds current Deno-specific repository, dependency,
  compatibility, security, quality, publication, and artifact guidance.
- `explore-ecosystems` maps monorepos, sibling packages, coordinated
  repositories, plugins, adapters, integrations, and deliberate exclusions.
- `build-clis`, `build-web`, `build-apis`, `build-workflows`, `build-data`, and
  `build-devtools` apply that research to focused engineering workflows.
- `use-okikio` grounds Okikio packages and project patterns in local and
  primary-source evidence.

The skills are independently installable and deliberately composable.
`deliver-software` owns the lifecycle, `deno-software` owns Deno contracts,
`explore-ecosystems` owns dependency topology, and focused skills own workflow
architecture and verification criteria.

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

Results must compare no-skill, individual-skill, and composed-skill variants. An
optimized candidate is never promoted solely because an LLM judge prefers its
prose.

## Development

Install Deno 2, then run:

```sh
deno task validate
deno task check
deno task test
```

Cross-model runs require the provider commands configured in
`evals/models.json`. Credentials remain in the environment and are never written
to fixtures, traces, or reports.

SkillOpt is kept as a separately reproducible optimization layer. See
`skillopt/README.md`. Generated candidates are review artifacts, not source
files, until they pass held-out, cross-model, composition, and safety gates.
