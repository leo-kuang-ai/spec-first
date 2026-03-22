# Focus Requirements

## 1. Background
- Source requirement: checkout coupon preview during order confirmation
- Current owner: `web-checkout`
- Workspace context: `checkout-web` owns the current web checkout experience; `shared-api-types` is present for request and response shape alignment
- Goal of this document: narrow the reviewed multi-side demand into the scope the `web-checkout` owner can take into downstream review

## 2. Owner Scope
- One-sentence scope: add coupon preview interaction to the web checkout page, using backend preview results to update pre-submit price display
- Covered modules/pages/domains: web checkout page, coupon input interaction, order summary preview rendering, coupon removal interaction
- Explicit boundary: this owner handles web-side interaction and rendering only; backend validation logic, final order-submit enforcement, app parity, and admin configuration are outside this scope

## 3. In Scope
- Add coupon input entry point on web checkout
- Submit coupon preview request from web checkout
- Render preview success state with updated discount amount and payable estimate
- Render failure states for invalid, expired, and threshold-not-met coupons
- Support removing an applied coupon and restoring original price preview
- Mark previewed price as estimate before final order submission

## 4. Out of Scope
- Backend implementation of coupon preview API
- Final coupon validation during order submit
- App checkout parity
- Admin-side coupon configuration and campaign tooling
- Monitoring and alert rule implementation beyond web-side event emission if needed

## 5. Relevant Flows
- Happy path:
  - user enters coupon code
  - web sends preview request
  - backend returns valid preview result
  - checkout summary updates discount and payable estimate
- Edge or exception paths:
  - invalid or expired coupon returns failure state with no payable update
  - threshold-not-met coupon returns failure state with original totals preserved
  - user removes coupon after successful preview and original totals are restored

## 6. Dependencies
- Team/module dependencies: backend checkout owner must provide preview API and response contract
- Interface/data dependencies: preview response must include normalized coupon state, discount amount, estimated payable amount, and user-displayable reason code
- External platform/config dependencies: campaign team must maintain valid coupon rules outside this owner scope
- Dependency status: API exists only as reviewed requirement intent; payload details are still pending confirmation

## 7. Acceptance Criteria
- Web checkout exposes a visible coupon entry interaction before order submission
- Applying a valid coupon updates the displayed discount and estimated payable amount without creating an order draft
- Applying an invalid, expired, or threshold-not-met coupon shows a non-silent failure state and does not corrupt displayed totals
- Removing an applied coupon restores the pre-coupon price preview
- Checkout UI clearly communicates that coupon preview is pre-submit only and final payable amount is determined during order submit

## 8. Non-Functional Constraints
- Known constraints: preview request must not create server-side order state; UI must distinguish estimate from final payable amount
- Constraints requiring later technical planning: promotion traffic spikes may require backend rate or cache strategy
- Unresolved constraints: web-side timeout and retry behavior for preview API is not yet specified

## 9. Assumptions
- Backend will expose a single preview endpoint for web checkout to call
- Web can reuse existing checkout summary rendering with incremental price fields rather than creating a second summary component

## 10. Open Questions
- Blocking questions:
  - what is the exact preview response contract for invalid vs expired vs threshold-not-met states?
- Non-blocking questions:
  - what final product copy should be shown for each coupon failure state?
  - should web emit a dedicated analytics event for coupon preview failure reasons in this iteration?
