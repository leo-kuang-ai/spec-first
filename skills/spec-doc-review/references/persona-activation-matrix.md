# Persona Activation Matrix

This is a **lazy reference** for SKILL.md. Load when the quick-reference activation table in the spine doesn't resolve whether to activate a conditional persona. The table in the spine covers typical trigger signals; this file contains the full decision logic with two-leg activations, suppression rules, and edge cases.

---

## product-lens

Activate when the document makes challengeable claims about what to build and why, or when the proposed work carries strategic weight beyond the immediate problem.

**Leg 1 — Premise claims:** The document stakes a position on what to build or why that a knowledgeable stakeholder could reasonably challenge:
- Problem framing where the stated need is non-obvious or debatable
- Solution selection where alternatives plausibly exist (implicit or explicit)
- Prioritization decisions that explicitly rank what gets built vs deferred
- Goal statements that predict specific user outcomes, not just restate constraints

**Leg 2 — Strategic weight:** The proposed work could affect system trajectory, user perception, or competitive positioning:
- Changes that shape how the system is perceived or what it becomes known for
- Complexity or simplicity bets that affect adoption, onboarding, or cognitive load
- Work that opens or closes future directions (path dependencies, architectural commitments)
- Opportunity cost implications — building this means not building something else

## design-lens

Activate when the document contains:
- UI/UX references, frontend components, or visual design language
- User flows, wireframes, screen/page/view mentions
- Interaction descriptions (forms, buttons, navigation, modals)
- References to responsive behavior or accessibility

## security-lens

Activate when the document contains:
- Auth/authorization mentions, login flows, session management
- API endpoints exposed to external clients
- Data handling, PII, payments, tokens, credentials, encryption
- Third-party integrations with trust boundary implications

## scope-guardian

Activate when the document contains:
- Multiple priority tiers (P0/P1/P2, must-have/should-have/nice-to-have)
- Large requirement count (>8 distinct requirements or implementation units)
- Stretch goals, nice-to-haves, or "future work" sections
- Scope boundary language that seems misaligned with stated goals
- Goals that don't clearly connect to requirements

## adversarial

Activate when the document contains a high-value challenge surface. Routine plans with stated rationale are not by themselves an adversarial signal — premise/assumption work re-litigates settled questions when the only signal is "this plan is well-structured." Activate when ANY of the following holds:

- The document is a **requirements document** with 2+ challengeable claims (problem framing, solution selection, prioritization, predicted outcomes)
- The document touches a **high-stakes domain** — auth, payments, billing, data migrations, privacy/compliance, external integrations, cryptography — regardless of doc type or size
- The document **proposes a new abstraction, framework, or significant architectural pattern** — regardless of doc type
- The document is a **plan with no validated upstream Product Contract signal** (no legacy `origin:` requirements doc and no `product_contract_source: spec-brainstorm` or `legacy-requirements`)
- The document is a **plan that explicitly extends scope** beyond its origin requirements doc (new actors, new flows, deferred-then-restored features)
- The document contains an **explicit alternatives section** or unresolved tradeoffs

Do NOT activate adversarial on a routine plan document that derives from a validated upstream Product Contract, stays within scope, and does not introduce high-stakes domains or new abstractions. Validated upstream provenance includes legacy `origin: docs/brainstorms/...`, `product_contract_source: spec-brainstorm`, and `product_contract_source: legacy-requirements`. A direct `product_contract_source: spec-plan-bootstrap` plan is greenfield and does not suppress premise-level techniques by itself.
