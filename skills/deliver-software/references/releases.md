# Releases

## Authority and scope

A release changes external state. Preparing a release, proving readiness, and
publishing are separate actions. Do not publish, push tags, deploy, notify users,
or mutate registries unless the request authorizes that action.

Identify the product or package, version source of truth, target registries or
environments, workspace release set, supported upgrade paths, and rollback or
forward-fix strategy.

## Readiness

Require the repository's real quality gates, a clean or intentionally understood
worktree, current generated artifacts, correct package contents, migration and
compatibility notes, and successful clean-consumer installation.

For workspaces, verify version and dependency-range consistency across every
released package. Inspect tarballs, bundles, binaries, images, checksums,
signatures, provenance, and SBOMs when those artifacts are part of the release
contract.

## Mutation preflight

Before publishing, confirm:

- authenticated identity and target account;
- package, scope, project, and environment ownership;
- version availability and immutability;
- tag and branch protection;
- secret handling;
- expected messages, charges, or deployment effects;
- recovery from partial multi-target publication.

Never rewrite an immutable public version or destructively retag a released
commit to hide a partial failure.

## Publish and verify

Publish in dependency order where required. Record exact resulting versions,
digests, URLs, and registry states. Install or fetch the released artifact from
its public target into a clean consumer and run a real supported workflow.

If one target succeeds and another fails, report a partial release. Choose a
forward fix, deprecation, or follow-up version based on registry immutability and
consumer impact. Do not report the release as successful because one target
completed.

## Post-release

Verify availability, installation, startup, migrations, telemetry, and
documented examples. Preserve provenance and release evidence. Communicate
breaking changes and recovery steps when user-facing release communication is
in scope.

