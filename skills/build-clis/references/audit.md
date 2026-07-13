# CLI audit

## Contract inventory

Build one map before editing:

| Surface | Owner | Source | Generated consumers | Executable proof |
|---|---|---|---|---|
| Commands and aliases | Parser/registry | | Help, completion, man | |
| Config fields | Schemas/resolver | | Explain, docs | |
| Results | Renderer/result category | | Pipelines/files | |
| Diagnostics | Logger/category policy | | stderr/log files | |
| Errors and exits | Failure mapper | | Shell/automation | |
| Signals and cleanup | Composition root | | Workers/subprocesses | |
| Installation | Package/build owner | | PATH/completion/man | |

Inspect the import graph. Files present in the tree may be abandoned experiments,
stubs, or migration inputs. A command definition is not reachable until it is
registered through the executable entrypoint.

## Compare four truths

For every material behavior, distinguish:

1. intended: architecture or handoff says it should exist;
2. documented: user-facing docs claim it exists;
3. implemented: source appears to implement it;
4. verified: an executable check demonstrates it.

Report `implemented but unverified` and `documented but missing` explicitly.
Never promote an aspiration into a completion claim.

## Parity checks

Compare:

- README examples against actual tasks and entrypoints;
- documented flags against parser terms, aliases, and accepted values;
- tasks against declared permission sets and existing files;
- command registry against help, completion, and manual output;
- environment/config descriptions against actual source adapters;
- package scripts against documented wrappers;
- dependency versions across root, package, lockfile, and generated package;
- error recommendations against executable command names.

## End-to-end source trace

For each public source, record the exact path into the runtime request. Watch for
one name being reused for two meanings, parser defaults becoming high-precedence
patches, and final schemas losing refinements when `.shape`, `pick`, `extend`, or
manual reconstruction is used.

## Audit verdict

Return:

- confirmed working surfaces;
- partial or unreachable surfaces;
- documentation and generated-surface drift;
- failure and security risks;
- smallest coherent correction;
- checks run and checks blocked.
