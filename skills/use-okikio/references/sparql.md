# `@okikio/sparql` and SPARQL execution

The reviewed consumer uses `@okikio/sparql` through query construction,
execution, error mapping, a query specification, filter/sort/pagination mapping,
result transforms, and safe query preview. Inspect the actual package source and
exports at the installed revision before writing API calls.

## Boundary model

Separate:

- domain/query specification;
- approved fields, predicates, sorts, and pagination;
- RDF term and parameter serialization;
- SPARQL text construction;
- HTTP transport and credentials;
- result media type and parsing;
- domain result transform;
- engine/protocol failure mapping;
- redacted preview and diagnostics.

Do not concatenate untrusted values or identifiers into query text. Use the
package's verified term/parameter builders and allowlists. Engine-specific
features and update semantics require deployed-engine evidence.

## Verification

Inspect generated SPARQL, test Unicode/language/datatype values, optional and
missing bindings, pagination/order stability, HTTP status and malformed results,
timeout/cancellation, credential redaction, and representative engine behavior.

PopModern's older manual SPARQL implementations are historical/counterexample
evidence, not automatically the current package contract.
