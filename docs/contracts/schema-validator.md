# Lightweight Schema Validator Contract

`src/contracts/schema-validator.js` is a small deterministic validator for spec-first contract tests and doctor evidence checks. It is not a full JSON Schema implementation and must not be treated as a replacement for Ajv or another standards-complete validator.

## Supported Keywords

The validator enforces:

- `type`, including union type arrays
- `enum`
- `const`
- `required`
- `properties`
- `items`
- `contains` (at least one array item must match the child schema)
- `additionalProperties: false`
- `additionalProperties` as a child schema object
- `anyOf`, `oneOf`, `allOf`
- `if` / `then` / `else`
- `minItems`, `maxItems`
- `minLength`, `maxLength`
- `pattern`
- `minimum`, `maximum`

## Advisory Keywords

Keywords outside that list are advisory in this validator. In particular, `format`, `$schema`, `$id`, `title`, `description`, `default`, and `examples` are not enforced here.

If a contract needs standards-complete JSON Schema behavior, add an explicit dependency and tests for that consumer instead of assuming this lightweight validator already provides it.
