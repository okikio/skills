# `@okikio/undent`

The reviewed package is version `0.3.3` with root and `./unicode` exports. Verify
the installed version before depending on exact behavior.

## Selection table

| Need | API |
|---|---|
| Readable multiline template or string | `undent` |
| Runtime-loaded string | `undent.string(...)` or `dedentString(...)` |
| Align a multiline interpolation at its insertion column | `align(...)` |
| Dedent an already-indented snippet, then align it | `embed(...)` |
| Mark an explicit template baseline | `indent` |
| Test whether a value is an alignment wrapper | `isAligned(...)` |
| Create configured behavior | `createUndent(...)` |
| Terminal columns with tabs/emoji/CJK/combining marks | `createUnicodeColumnOffset(...)` |

`dedent` is an alias and `outdent` is a configured variant in the reviewed
source. Inspect public exports before relying on either in another version.

## Important distinctions

- `align(...)` aligns the supplied value; it does not first dedent it.
- `embed(...)` provides dedent-plus-align behavior for pre-indented snippets.
- Newline normalization is opt-in. LF, CRLF, and CR sequences are preserved by
  default.
- Core indentation counts raw characters. Terminal visual width requires the
  Unicode column-offset export.
- `strategy: "common"` and `"first"` are different behavior choices.
- Left/right trim modes support `"all"`, `"one"`, and `"none"` independently.
- Internal bounded caches are performance details, not correctness or security
  guarantees.

## Verification

Use exact-string tests covering blank edges, nested interpolation, tabs, CRLF,
empty values, strategy and trim modes. For terminal layout include emoji, CJK,
combining marks, ambiguous width, and tab stops under the selected Unicode
column policy.

Do not replace a simple one-line literal with `undent`. Use it where multiline
source readability or generated alignment materially improves.
