# CLI verification

## Layered checks

1. Schema tests cover normalization, refinements, defaults, aliases, and invalid
   combinations.
2. Parser/source tests cover grammar, sparse patches, and adapter mapping.
3. Resolver tests cover real files, extension layers, factories, precedence,
   operations, provenance, and defaults.
4. In-process program tests cover handler composition and typed results.
5. Subprocess tests cover exact stdout, stderr, exit codes, signals, TTY modes,
   prompts, and bootstrap failures.
6. Generated-surface tests cover help, completion, man, docs, and drift.
7. Packaging tests cover compiled or published artifacts in a clean consumer.

## Behavioral matrix

At minimum verify:

- successful human and machine-readable result;
- invalid token grammar;
- semantically invalid merged input;
- missing and malformed configuration;
- unavailable network/service;
- permission failure;
- one public diagnostic per failure;
- quiet and silent semantics;
- nested secret redaction;
- redirection and pipe behavior;
- non-interactive prompt behavior;
- first and second interrupt where implemented;
- resource cleanup and logger flush;
- resume/retry behavior where claimed.

## Configuration oracles

Use real temporary c12 projects for extension and factory behavior. Unit tests of
the custom merge function cannot prove loader integration. Use a counter to prove
one factory evaluation and assert resolved provenance, not only the final value.

## Installation oracles

Run the artifact through the same entrypoint users receive. Check version, help,
one real command, failure output, completion/man generation or installation,
required assets/workers, and uninstall/cleanup. Test every OS/architecture that
the release claims; otherwise narrow the claim.

## Reviewability oracle

For Markdown changes, inspect the diff and fail if unrelated paragraphs, tables,
or code blocks were reformatted. Code formatter checks must exclude Markdown.
