# Releases and versioning

## Release source

Release from a clean immutable commit or tag. Define the one version source and
validate semantic version, prerelease policy, changelog, generated files, and
manifest propagation before publication.

## Gate sequence

1. working tree and revision check;
2. dependency/lock and generated-drift check;
3. format/lint/type/test without broad Markdown formatting;
4. source and generated package builds;
5. package-content and clean-consumer tests;
6. version/changelog/provenance verification;
7. dry run or staging publish where supported;
8. immutable publish and tag/release assets;
9. post-publish clean install and smoke;
10. rollback/yank/deprecation response if post-publish verification fails.

## Provenance

Record revision, tool versions, lockfile, build command, package digests,
publisher identity, and CI run. Sign or attest artifacts where the ecosystem and
threat model justify it.

## Multi-registry publication

Generate both artifacts from one source and version. Verify exports, dependencies,
contents, provenance, and clean consumers separately for each registry. Do not
call the release complete because the first publication succeeded.
