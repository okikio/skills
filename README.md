# okikio/skills

Reusable engineering skills with shared guides, technical references and a
project handbook. Start with the user's outcome, identify the consequential
unknowns, run the smallest useful probe, and carry the change through its real
consumers and acceptance checks.

The collection works with an existing project's language, architecture,
packages and tools. A Python service can remain a Python service; a native Rust
tool can remain native-only. Select a runtime or provider guide when its
contract is part of the task.

## Find the right kind of guidance

| You need to know | Start here |
| --- | --- |
| Which capability fits the request | [Skill router](START.md) |
| How skills, guides, references, playbook and handbook relate | [Guidance ownership](GUIDANCE.md) |
| What every code change must account for | [Software quality](guides/software-quality.md) |
| How to turn unknowns into experiments and decisions | [Product method](guides/product/README.md) |
| Which procedure and evidence gates fit a project task | [Playbook](handbook/playbook.md) |
| How a team adopts and operates the method | [Handbook](handbook/README.md) |
| How to use exact public utility contracts | [use-utils](skills/use-utils/SKILL.md) |

Skills own capabilities such as planning, refactoring, reviewing, testing,
benchmarking, verification and writing. Domain skills own API, data, workflow,
library, CLI, web and tooling contracts. Shared guides own reusable methods;
references provide detail only when it is relevant. A composed task keeps one
plan and one completion verdict.

`deliver-software` has been split into focused capabilities and shared quality
sources. See [START.md](START.md) for the current routes. Historical revisions
remain in Git; do not install the retired umbrella alongside its replacements.

## Install a self-contained skill bundle

The authored tree has one owner for each shared document. A source skill folder
therefore depends on files outside that folder. Ordinary skill installers copy
only a selected folder; direct `npx skills add okikio/skills` does not provide
this source layout's complete shared guidance.

Build regular-file bundles before installing individual skills. Deno 2 is the
collection's development tool; it is not a runtime requirement for projects
that use the resulting Markdown skills.

```sh
git clone https://github.com/okikio/skills.git
cd skills
deno task bundle --out .dist/skills --skill plan-changes
npx skills add ./.dist/skills
```

Omit `--skill` to bundle the complete collection, or repeat it for selected
capabilities. Pin the checkout to a reviewed commit for reproducibility. Pass
`--ref` with that same commit or review branch when generating source links to
optional companion skills. Bundles include the required shared documents,
rewritten local links and attribution. They do not activate absent companions
or copy private operational records.

Use your host's documented skill directory or local installer to install the
built folders. Verify one real task after installation; a copied directory or a
successful structural check does not prove that the host activated the skill.
For whole-project adoption, follow [the adoption procedure](handbook/adoption.md)
and merge project instructions against current source instead of overwriting them.

## Use public package guidance deliberately

`use-utils` covers packages and entry points verified in
[`okikio/utils`](https://github.com/okikio/utils). `use-okikio` covers the distinct
public library ecosystem, including observables. Package names, source exports,
registry releases and installed behavior are separate facts. Inspect the
resolved artifact before adopting an example; source version fields do not
prove a usable release exists in a registry.

## Develop and validate the collection

```sh
deno task validate
deno task check
deno task test
deno task bundle --out .dist/skills
deno task skillopt:matrix
```

Validation checks portable metadata, Markdown resource links, authored document ownership, source
records and evaluation coverage. Packaging tests inspect isolated installed
files and dependency identity. The coverage ledger requires train, valid-seen
and held-out scenarios for each operational capability. Navigation indexes,
licenses, templates and attributed upstream examples support their owning
capability; they are not independent instructions to activate.

[SkillOpt](skillopt/README.md) retains immutable exports, target and judge
adapters, fixture isolation, complete reports and paired gates. A no-target
baseline omits the target skill. It does not invent a revision or compare a
missing skill's size. Frozen cases stay outside optimization. Generated
candidates are review artifacts and are never promoted automatically.

Structural tests and case registration do not establish model quality.
Behavior claims require actual trajectories, applicable fixture checks and
honest limits. Record passed, failed, blocked and unrun checks separately.

## Maintain the sources

Read [AGENTS.md](AGENTS.md) before changing guidance or tooling. Update canonical
guides and references, then regenerate bundles. Preserve meaningful consumer
migration, current primary-source citations and third-party notices. Keep
project secrets, private incidents and recovery archives outside this public
collection.
