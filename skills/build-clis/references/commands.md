# Command language and Optique

## Design the language first

Define nouns, verbs, nesting, defaults, aliases, destructive operations, output
modes, and no-argument behavior before wiring handlers. Prefer names that remain
clear in scripts and error messages.

Prevent impossible token combinations structurally when the parser can express
them. Examples include positive/negative flag pairs, singular/plural alternatives,
and mutually exclusive selectors. Keep cross-source and domain rules in the
final schema.

## Sparse source rule

Parser defaults are user-interface conveniences, not automatically authored
configuration. Preserve whether a value was absent so lower-precedence sources
can participate. Normalize aliases once into a canonical runtime value.

## Optique ecosystem

Inspect the whole relevant Optique package set before implementing around only
the core parser. Depending on the installed version, capabilities may be split
across core, run, discover, environment, config, prompts, Git, LogTape, Temporal,
Zod, Valibot, Standard Schema, completion, and manual-generation packages.

Use static command registration when bundlers or compiled binaries must see the
entire graph. If dynamic discovery is chosen, prove it in the packaged target.

Do not add Citty beside Optique merely for nested commands. Treat overlapping
parsers as alternatives unless an explicit boundary justifies both.

## Schema composition trap

When building a final schema from component shapes, inventory refinements,
transforms, defaults, and brands. Copying `.shape` does not necessarily preserve
cross-field refinements. Reapply shared semantic checks deliberately and test
the final schema.

## Generated surfaces

Help, completion, and manuals should derive from the same command model where
possible. Verify:

- concise root and subcommand help;
- help without valid project config;
- version and no-argument behavior;
- aliases, defaults, enum values, and deprecations;
- Bash, zsh, fish, PowerShell, and Nushell where claimed;
- man-page command and option parity;
- typo suggestions and stable error wording.

Generated output must have drift detection. A command is not complete when its
parser changed but help, completion, docs, or man output remained stale.
