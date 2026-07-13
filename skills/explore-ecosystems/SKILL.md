---
name: explore-ecosystems
description: Investigate a material library, framework, tool, protocol, or service as a possible monorepo or wider ecosystem before selecting, integrating, replacing, upgrading, or recommending it. Use when sibling packages, official adapters, plugins, companion repositories, specifications, or adjacent systems could change the decision. Do not use for incidental imports or a purely local edit with no dependency decision.
---

# Explore ecosystems

Treat every material dependency as an ecosystem hypothesis. This is a required
investigation posture, not permission to claim that every project is a monorepo.

## Outcome

Produce an evidence-backed map that answers:

- what the target actually is and who owns it;
- which first-party and interoperable projects matter to this task;
- which package owns each required capability;
- which alternatives or siblings deliberately remain excluded;
- what versions, runtimes, hosts, licenses, and maturity boundaries constrain it;
- how the chosen set integrates with the existing repository;
- which executable checks can prove the important claims.

## Materiality and stopping

Use two levels of investigation:

1. Every dependency in the task's dependency inventory gets a cheap ecosystem
   identity check. Inspect its manifest identity and canonical repository or
   organization metadata for workspace packages, official adapters, plugins,
   and companion projects. Record verified, standalone, or unresolved status.
2. Material dependencies get the full topology, capability, compatibility,
   failure, integration, exclusion, and verification analysis below.

A dependency is material when its selection or integration can change
architecture, manifests, runtime or host compatibility, public contracts,
security, operations, generated artifacts, deployment, or verification.
Incidental imports and unchanged local helpers do not qualify for the deep
mapping pass merely because they appear in source.

Research is read-only unless the request authorizes changes. Stop when capability
ownership, compatibility, exclusions, and verification evidence are sufficient
for the named decision. Record unresolved claims and the exact next evidence
instead of expanding research without a decision boundary.

## Procedure

1. Name the decision. Do not research an ecosystem without stating what choice
   the evidence must support.
2. Establish identity from installed manifests, lockfiles, source imports, the
   package registry, the canonical repository, and official documentation.
3. Classify the topology as a verified monorepo, verified multi-repository
   ecosystem, plugin ecosystem, specification ecosystem, standalone project,
   or unresolved.
4. Map first-party siblings, adapters, plugins, presets, integrations, examples,
   and adjacent specifications. Label community and experimental work clearly.
5. Trace the repository's actual capability owners before proposing additions.
   Avoid installing a second parser, logger, configuration loader, router, ORM,
   or schema owner without an explicit coexistence contract.
6. Inspect failure behavior, configuration, security, compatibility, lifecycle,
   and deliberate exclusions, not only the happy-path API.
7. Re-evaluate the original choice. Prefer the smallest coherent capability set,
   not the largest number of same-organization packages.
8. Verify material claims through source, tests, a minimal executable workflow,
   or a clean consumer. Report unresolved claims as unresolved.

## Reference routing

- Read [evidence.md](references/evidence.md) to establish identity, provenance,
  freshness, and claim strength.
- Read [topology.md](references/topology.md) to discover and classify related
  projects without inventing relationships.
- Read [selection.md](references/selection.md) when choosing packages,
  alternatives, or ownership boundaries.
- Read [integration.md](references/integration.md) before changing manifests or
  connecting packages to an existing system.
- Read [failures.md](references/failures.md) for investigation traps, failure
  signatures, and counterexamples.
- Read [method.md](references/method.md) for the compact reusable worksheet.

Workflow skills own implementation semantics. `deliver-software` owns request
authority, repository change, and the final completion verdict. This skill owns
dependency topology and evidence. When composed, discover the repository once
and share one evidence map.
