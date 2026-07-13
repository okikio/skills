# Evidence and provenance

## Evidence order

Use the strongest available evidence for each claim:

1. the consuming repository's resolved lockfile, source imports, tests, and
   executable behavior;
2. source and tests at the exact installed revision;
3. canonical manifests, generated API documentation, and release notes;
4. current official documentation and examples;
5. maintainer announcements or issue discussions;
6. community examples and search summaries as discovery leads only.

Do not let newer documentation silently override the installed version. Do not
let a local README prove behavior that the code and tasks contradict.

## Claim record

For every decision-changing claim, record:

- the exact claim;
- source path or URL;
- package/repository version or commit;
- verification date;
- whether it was observed, documented, inferred, or unresolved;
- the decision it affects.

Use primary sources at the claim level. A single repository URL is not enough
when package identity, adapter status, and runtime support come from different
places.

## Installed truth versus current truth

Inspect both:

- installed truth determines what the repository can use now;
- current truth determines available upgrades, deprecations, and migration
  paths.

When they differ, state the boundary explicitly. Prerelease packages, generated
clients, private adapters, forks, patches, overrides, and vendored source require
revision-specific evidence.

## Negative evidence

Absence is a claim too. Before saying a feature or export does not exist, search
the public entrypoints, package exports, source tree, generated artifacts, tests,
and relevant branches or tags. Phrase incomplete searches narrowly.

For example, a README that advertises `stringify` while the published export map
and source contain no implementation proves a contract discrepancy. It does not
prove what a future release will contain.
