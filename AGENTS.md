# Repository instructions

Treat skills, shared guides, references, handbook procedures and generated
installation bundles as production agent behavior. Start with [START.md](START.md)
and [software quality](guides/software-quality.md). Read decision-specific
originals before editing. Explicit user requirements and repository facts
control the task; archived examples do not create authority.

## Ownership and portability

- Skills own capability execution. Shared guides own reusable methods and
  obligations. References supply technical detail. The handbook explains
  adoption; its playbook sequences procedures and evidence gates.
- Keep one authored owner for each rule. `guides/software-quality.md` is the
  common contract, with detail in `references/` and focused guides. Do not
  restore the retired delivery umbrella or maintain generated copies by hand.
- Preserve the portable Agent Skills metadata contract and valid relative links.
  Validate installed regular-file bundles, not only the source checkout.
  Declare local resource dependencies with Markdown links, images or reference
  definitions. Raw HTML attributes and paths inside code examples are not
  dependency declarations.
- Keep generic behavior as the default. Existing projects choose their runtime,
  schema library, tools, providers, layout and supported hosts. Optional ecosystem
  guidance cannot impose a private registry or deployment stack.
- Verify exact package names, exports and behavior against current public source
  and the resolved consumer artifact. Source versions do not prove publication.
- Preserve third-party attribution and licenses. Do not import private research,
  credentials, personal storage links, incident records or restricted catalogues.

## Engineering and writing

- Keep this tooling in strict Deno TypeScript and ESM. Preserve existing
  dependencies and tests unless a demonstrated contract requires migration.
- Use strict Zod objects for this repository's serialized executable contracts
  and infer project types from schemas. This local choice does not mandate Zod
  in unrelated consumers. Standard Schema and JSON Schema have distinct roles.
- Trace callers, imports, exports, generated files, fixtures and documentation
  before replacing code or a guidance owner. Complete the cutover without
  obsolete aliases unless compatibility is explicitly required.
- Explain ownership, invariants, defaults, failures and cleanup in useful TSDoc
  and internal comments. Keep prose concrete and source-grounded.
- Never run a broad formatter over Markdown. Make focused semantic patches and
  preserve unrelated wrapping, spacing and code blocks. Format changed code
  with the repository's tools and inspect the diff.
- Keep installed `.agents/` guidance separate from disposable investigation.
  Use the repository-approved ignored workspace for probes and scratch output;
  keep durable tests with their owner. Follow the
  [native-tool procedure](handbook/engineering/native-tools.md) before adding
  package selection code, and the [structure guide](guides/naming-and-folder-structure-guide.md)
  when moving files or splitting responsibilities.
- Group commits by capability or behavior. Keep mechanical formatting separate
  from functional changes. Record the actual source and checks in review prose.

## Evaluation and delivery

- Add or update task cases for material behavior and reference changes. Each
  canonical operational document needs an owner in `evals/capabilities.json`,
  registered source evidence, and train, valid-seen and held-out coverage.
  Shared documents have one canonical owner; generated bundle copies inherit it.
- Resource indexes route reading. Licenses, templates and attributed source
  examples support an operational owner; they do not independently authorize work.
  Required resources must remain reachable and present in installed bundles.
- Keep SkillOpt's complete pipeline: immutable export, target and optional judge
  execution, complete aggregate reports and paired gates. Preserve case/run
  matrix, model, judge, revision, optimization-unit and reference identity.
- A no-target baseline omits only the target skill and does not invent its
  revision or size. Dependency changes must affect installed artifact identity.
- Never train on frozen cases or promote generated candidates automatically.
  Migrate retired path/skill bindings without treating held-out results as
  training evidence. Preserve fixture and evaluator integrity.
- Run relevant checks, inspect built artifacts and exercise representative
  installed skills. Report what each check establishes and what did not run.
  A structural pass, case count or push does not prove model behavior or CI.
