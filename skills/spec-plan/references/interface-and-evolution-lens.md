# Interface Design And Evolution Planning Lens

Read this reference when the request, Product Contract, or current source shows that the plan will add, expose, replace, or evolve a durable interface. Interfaces include public APIs, CLI contracts, event/message schemas, shared types, cross-module protocols, and durable input/output/error contracts used by multiple independent consumers.

This lens owns plan-time interface design and evolution decisions. It does not own implementation-time drift findings, replace `api-contract-reviewer`, or elevate REST, TypeScript, or a particular schema tool into a universal standard.

## Trigger And Negative Boundary

Trigger this lens when the work:

- creates a new interface for external or cross-module consumers;
- changes an existing interface's fields, types, error model, nullability, defaults, ordering, versioning, or lifecycle;
- replaces, deprecates, or removes an interface that has consumers;
- adds or migrates a canonical contract artifact.

Stay lightweight and do not trigger this lens for:

- a private helper, private method, or internal module rearrangement with no observable-contract change;
- an ordinary refactor that changes implementation but no plan-time interface decision;
- implementation drift from an existing canonical artifact found during code review. That finding remains owned by `api-contract-reviewer` unless fixing it requires a new product or architecture decision.

The LLM judges applicability, whether the interface is durable, and whether consumers are independent from current source and the Product Contract. Scripts validate only deterministic facts such as paths, schemas, parser/test exits, and artifact existence.

## Shared Contract Core

Both greenfield and evolution work begin by making the same core decisions explicit:

- the interface purpose, owner, and named consumers;
- the canonical artifact's repo-relative path, type, and source owner;
- the protocol or invocation boundary, including request/input, response/output, and error model;
- validation, authorization, privacy, or data-classification boundaries, linking applicable high-risk decisions instead of duplicating security rules here;
- the compatibility, versioning/deprecation posture, and rollback path;
- the repo-native parser, contract test, or executable check that will verify the artifact and implementation during execution.

Record only contract decisions that change implementation, migration, consumers, or verification. Naming style, HTTP verbs, pagination shape, PATCH semantics, and similar choices may be conditional patterns for the current stack, but they are not rigid cross-project templates.

## Greenfield Branch

When the interface does not yet exist:

- define the contract consumers need to observe before choosing a representation or framework shape;
- record the target artifact path, type, and owner in the plan, and bind it to the U-ID responsible for creating it;
- define success, error, null, and empty boundaries plus the minimum compatibility posture;
- place consumer integration and contract verification in the relevant implementation unit instead of creating a long-lived, unconnected interface scaffold.

A greenfield canonical artifact may not exist yet, but the plan must name both its creation owner and verification owner. If either is missing, retain an Open Question and do not claim that the affected unit is implementation-ready.

## Evolution Branch

When the interface already exists:

- read the current canonical artifact directly and classify the change as additive, a compatible behavior change, deprecating, or breaking;
- prefer an additive optional change by default, while still checking whether consumers could misinterpret a new sentinel, default, or ordering rule;
- use replacement-first for breaking changes or removal: define the replacement and consumer migration before the compatibility window, deprecation signal, rollback, and removal condition;
- require zero-use evidence before deletion, from a current consumer search, telemetry/query, or an owner-confirmed inventory. "It looks unused" is insufficient;
- when the artifact is unreadable, consumers cannot be located, or a parser/test is unavailable, record the limitation and unblock owner instead of upgrading the unknown into a compatibility conclusion.

## Planning Contract Landing

When applicable, add a lightweight `### Interface Contracts` subsection to the Planning Contract. Record the following for each load-bearing interface:

| Field | Required content |
| --- | --- |
| Interface / mode | Name plus `greenfield` or `evolution` |
| Consumers | Current or target consumers, with unknowns marked explicitly |
| Canonical artifact | Repo-relative path, type, and owner; bind greenfield creation to a U-ID |
| Contract summary | Protocol, input/output, error model, and load-bearing boundaries |
| Compatibility | Additive/deprecating/breaking classification, window, and replacement/rollback/removal posture |
| Verification | Repo-native parser/test/check owner, or `parser_unavailable` plus reason, owner, and unblock condition |

Do not copy the complete schema body into the plan. The plan records the owner, path, load-bearing contract decisions, and verification method; the canonical artifact owns the complete machine-readable or executable contract.

## Review And Failure Boundary

- `spec-plan` owns WHAT/HOW-level interface design, the evolution posture, and canonical-artifact landing.
- The implementation unit owns creating or modifying the artifact, running the repo-native parser/test, and recording the actual result.
- `api-contract-reviewer` checks whether a diff diverges from the current plan/artifact and consumer contract; it does not become the interface-design owner in reverse.
- When no repo-native parser/test exists, record `parser_unavailable`, use the narrowest substitute evidence, and limit the claim. Do not invent cross-format parser infrastructure in this task.
- If the work requires a new public API-design Skill, a second canonical contract, a cross-repo mutation owner, or an unauthorized schema/runtime boundary, stop and return to the plan owner.
