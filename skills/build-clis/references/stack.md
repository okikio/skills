# CLI stack

- Optique owns typed commands/options/help; inspect `@optique/*` integrations.
- c12 owns configuration discovery. defu owns default merging; verify custom
  merger key types and whether arrays concatenate or replace.
- Zod owns runtime application contracts after parsing/loading where needed.
- LogTape owns runtime output. Use dedicated result categories/sinks for stable
  stdout and diagnostics on stderr/files. Inspect core, pretty, file, redaction,
  testing, and official adapters including `@optique/logtape`.
- Exclude siblings that duplicate configuration ownership or lack project
  runtime/dialect support. Test parent sink inheritance so results are neither
  decorated nor duplicated.
