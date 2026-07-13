---
name: explore-ecosystems
description: Research a dependency as a possible monorepo or wider ecosystem before selecting, integrating, replacing, or recommending it. Use for library, framework, runtime, plugin, adapter, or tool research where sibling packages, official integrations, companion repositories, presets, or interoperable projects could change the decision.
---

# Explore Ecosystems

Treat every material dependency as an ecosystem hypothesis, not a claim that it
is a monorepo.

1. Establish the exact package, repository, organization, maintainer, version,
   runtime, and license from primary sources.
2. Inspect workspace manifests, exports, organization repositories,
   documentation navigation, examples, releases, and source imports.
3. Map first-party siblings, adapters, plugins, presets, integrations, and
   complementary projects. Separate official, community, experimental,
   deprecated, and unrelated items.
4. Inspect adjacent systems whose contracts affect the decision.
5. Record capabilities, configuration, compatibility, errors, security, and
   deliberate exclusions.
6. Re-evaluate the original choice. Prefer the smallest coherent set; do not
   install siblings merely because they exist.
7. Verify against project source and a minimal executable workflow.

Read [method.md](references/method.md). Workflow skills own implementation; this
skill owns dependency topology and evidence.
