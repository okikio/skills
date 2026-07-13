# Generated artifacts

## Required generator contract

- default read-only check mode;
- explicit `--write` or equivalent mutation mode;
- deterministic output and stable ordering;
- pinned source identity, URL, version, and digest where external data is used;
- explicit network/read/write permissions;
- semantic validation of inputs and outputs;
- atomic or safely replaceable writes;
- stale-output CI gate;
- no unrelated file or Markdown formatting.

## Mutable upstream sources

If an upstream `latest` URL is convenient, resolve it to an immutable version and
compare payload hashes before trusting it. Record both source identities and the
generator revision in generated output or a manifest.

## Source-aware updates

Prefer AST or structured-data edits when updating code/config constants. Preserve
comments and authored layout where they are part of reviewability. Check mode must
exit nonzero on drift without rewriting files; write mode should converge so the
second check is clean.

## Generated ownership

Mark generated files and point to their generator. Decide whether they are
committed, produced during build, or release-only. Verify clean-tree regeneration
and fail when manual edits would be overwritten.

## Failure tests

Exercise unavailable network, digest mismatch, malformed upstream data, unknown
schema version, partial write, permission denial, stale output, and deterministic
repeat generation.
