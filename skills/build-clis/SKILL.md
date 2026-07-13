---
name: build-clis
description: Design, implement, review, or refactor command-line applications, including parsing, configuration, structured output, logging, completion, manuals, errors, packaging, and tests. Use especially with Optique, LogTape, c12, defu, Zod, Deno, Mise, and related ecosystems.
---

# Build CLIs

Use `explore-ecosystems` for material dependency decisions.

1. Separate machine-readable results on stdout from operational diagnostics on
   stderr. Preserve pipes, redirects, exit codes, and signals.
2. Give parsing, configuration, schema validation, output, and command services
   one owner each.
3. Define flag, environment, config, and default precedence plus array/object
   merge behavior.
4. Use schema-first boundaries. Test normalization, aliases, defaults, invalid
   combinations, help, completion, and manuals.
5. Verify the installed CLI through pipes, redirects, errors, and a real flow.

Read [stack.md](references/stack.md) for Optique, LogTape, c12, and defu.
