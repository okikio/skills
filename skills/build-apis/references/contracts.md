# API contracts, validation, and problems

## Schema ownership

Use Zod v4 or the repository's selected runtime schema system for application
contracts and infer TypeScript types from schemas. Use the Standard Schema
`~standard.validate` contract when a reusable utility intentionally accepts
multiple validators.

Do not create parallel hand-written interfaces for the same boundary. Do not
claim a validator-neutral library requires every application to use multiple
schema systems.

## Definition and validator pairing

An endpoint definition describes the contract, but `c.req.valid("json")` or an
equivalent accessor is populated only by matching validator middleware. Register
the correct source validator and prove invalid input returns the stable problem
before the handler executes.

Validate path, query, header, cookie, JSON, and form sources independently where
their failure and coercion semantics differ. Normalize only after source-aware
validation.

## Full result contract

A response schema should describe what the handler returns across success and
known failures, not only the payload nested inside it. Include status, headers,
content type, body/problem shape, and empty-response behavior as applicable.

Map validation failures to stable client problems, unexpected validation defects
to internal diagnostics, and domain failures to documented problem types. Keep a
registry so OpenAPI and runtime responses use the same identifiers and schemas.

## Safe causes

Public problems must not copy raw database, provider, filesystem, or network
messages. Preserve the original cause structurally in redacted diagnostics and
return a stable safe detail to the caller.

## Contract verification

- parse actual successful and failure responses against published schemas;
- compare registered routes with OpenAPI operations;
- verify status/content-type/header variants;
- send malformed values through every source;
- assert handler non-execution on validation failure;
- assert no raw secret-bearing cause appears in the response.
