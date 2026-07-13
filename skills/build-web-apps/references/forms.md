# Forms and mutations

## State ownership

Separate input draft, validated client value, committed server request, pending
mutation, authoritative response, and displayed server error. A form library can
own field ergonomics; the server schema and domain service remain authoritative.

Use framework-local state for draft interaction. Put state in the URL only when
it is intentionally shareable/navigation state. Do not copy every keystroke into
the remote cache.

## Validation

Client validation improves feedback but never replaces server validation. Reuse
schema semantics without importing server-only secrets or resources into the
browser. Define async validation cancellation and stale-result behavior.

## Submission races

Prevent double submission, out-of-order responses, stale validation, route
navigation during submit, and lost server errors. Decide whether later submits
cancel, supersede, queue, or conflict with earlier ones.

## Mutations

Define query invalidation from the same identity factory used for reads. Use
optimistic updates only when rollback and concurrent server truth are clear.
Capture prior cache state, reconcile the authoritative response, and surface
partial or conflicting failures.

## Verification

Test keyboard submit, invalid and corrected fields, slow async validation,
double click, reordered responses, network loss, server validation, optimistic
rollback, navigation, focus on errors, and accessible status announcements.
