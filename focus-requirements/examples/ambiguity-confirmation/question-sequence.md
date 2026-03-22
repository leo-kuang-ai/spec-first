# Example Question Sequence

Below is the minimum confirmation sequence `/focus-requirements` should use for this case.

## Trigger 1: Owner Boundary Ambiguity

### Why this trigger fired

The source demand says "checkout frontend should show discounted payable amount", but it
also says existing order summary already calculates some local display fields. That makes
it unclear whether the owner only renders backend preview data or also owns fallback/local
price computation.

### Good question

Project: `spec-first`, current task: narrowing this reviewed discount-preview demand into
the current owner scope. I need to lock what the checkout frontend truly owns before I can
write the PRD.

Right now the requirement sounds like "show the discounted price", but there are two very
different meanings hiding inside that sentence. One is "frontend only renders the numbers
the pricing side gives it." The other is "frontend is also responsible for some local
price calculation or fallback logic." Those lead to very different scopes and risks.

RECOMMENDATION: Choose A because it keeps the owner boundary crisp and avoids silently
pulling pricing logic into a UI-focused PRD. Completeness: A 10/10, B 7/10, C 3/10

A) Frontend only renders eligibility, discount amount, and preview total returned by pricing/backend. `(human: ~0 / CC: ~0)`
B) Frontend also owns local fallback display calculation when preview data is partial. `(human: ~0 / CC: ~0)`
C) Keep it ambiguous for now and let downstream review decide. `(human: ~0 / CC: ~0)`

### Example answer

User chooses A.

### What gets resolved

- Owner scope is now render-only on the price preview
- Local pricing fallback is explicitly out of scope unless restated later

## Trigger 2: Dependency Ownership Ambiguity

### Why this trigger fired

The source demand does not clearly say whether "unavailable reason" is returned as final
display text by backend or as a normalized reason code that frontend maps to copy.

### Good question

Project: `spec-first`, current task: finishing the owner-scoped PRD for checkout frontend.
The remaining ambiguity is not about whether the UI shows an unavailable reason. It is
about who owns the meaning of that reason.

Think of it like a restaurant receipt. One approach is the kitchen sends the final printed
sentence. The other is the kitchen sends a short code and the cashier turns it into the
customer-facing message. Both can work, but they create different frontend dependency
shapes.

RECOMMENDATION: Choose B because backend-owned reason codes plus frontend-owned copy keep
dependency boundaries cleaner and make UI wording changes cheaper later. Completeness:
A 8/10, B 10/10, C 4/10

A) Backend returns final user-facing unavailable text. `(human: ~0 / CC: ~0)`
B) Backend returns normalized reason codes and frontend maps them to display copy. `(human: ~0 / CC: ~0)`
C) Keep both options open in the PRD. `(human: ~0 / CC: ~0)`

### Example answer

User chooses B.

### What gets resolved

- Dependency is now "backend must provide normalized reason codes"
- Frontend scope now includes copy mapping, but not eligibility logic itself

## Trigger 3: Acceptance Boundary Ambiguity

### Why this trigger fired

The reviewed demand says "users can trust the preview", which can mean either:
- the UI correctly renders backend preview results
- or the full preview amount is numerically reliable across pricing edge cases

Those are different owner acceptance boundaries.

### Good question

Project: `spec-first`, current task: finalizing acceptance criteria for the checkout frontend
owner. I need to separate what this owner can verify directly from what belongs to the
pricing side.

The phrase "users can trust the preview" sounds simple, but it can hide two promises.
One promise is "the UI shows the preview result accurately." The other is "the preview
number itself is financially correct in all cases." The frontend owner can fully own the
first promise, but only depend on the second.

RECOMMENDATION: Choose A because acceptance should stay on outcomes this owner can verify
directly, while pricing correctness remains a dependency and downstream review topic.
Completeness: A 10/10, B 6/10, C 3/10

A) Frontend acceptance = accurately render backend preview state and totals, with clear
estimate messaging. `(human: ~0 / CC: ~0)`
B) Frontend acceptance also includes end-to-end pricing correctness for all preview cases.
`(human: ~0 / CC: ~0)`
C) Leave acceptance broad and rely on engineering review to tighten it. `(human: ~0 / CC: ~0)`

### Example answer

User chooses A.

### What gets resolved

- Acceptance is now owner-verifiable
- End-to-end pricing correctness is recorded as dependency risk, not frontend acceptance

## After the three questions

The skill should stop asking unless a new hard ambiguity appears.

Normal remaining items should go into:
- `Dependencies`
- `Assumptions`
- `Open Questions`

The skill should now draft the PRD instead of continuing the interview.
