# Human and automation interaction

## No-argument and help behavior

A bare command should provide concise orientation or perform a safe default. It
must not require valid project configuration merely to render help or version.
Put common commands, examples, and the next useful action near the top.

## Prompts

Prompts require an interactive input capability. In CI, redirection, or an
explicit `--no-input` mode, either choose a documented safe default or fail
immediately with the exact flag needed. Never wait indefinitely.

Use explicit confirmation for destructive or expensive changes. For higher-risk
operations, separate plan from apply and show the target, current state, expected
effect, rollback, and required confirmation.

## Streams and TTYs

Treat stdin, stdout, and stderr TTY status independently. Support `-` as the
stdin/stdout sentinel only where ownership is unambiguous. Never mix diagnostics
into a machine-readable result stream.

Color, progress, animation, and pagers must respect stream capability, explicit
flags, environment conventions, reduced motion where relevant, and redirection.
A pager must not trap automation or corrupt binary/machine output.

## Secrets

Prefer environment, stdin, files with clear permission expectations, OS secret
stores, or interactive hidden input. Avoid secret values in argv because process
lists, shell history, and diagnostic captures can expose them. Never echo a
secret in result output, config explanation, support bundles, or errors.

## Recovery-oriented messages

An actionable failure should state:

- what failed in user language;
- the affected target or state;
- whether anything was changed;
- the safest next command;
- how to inspect, resume, retry, or roll back;
- where detailed diagnostics live.

Do not expose raw provider/database messages to users. Preserve the structured
cause in redacted diagnostics.
