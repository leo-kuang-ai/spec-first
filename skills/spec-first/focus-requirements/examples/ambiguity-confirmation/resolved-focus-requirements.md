# Resolved Focus Requirements Snapshot

This is a shortened example of what the PRD direction looks like after the three
ambiguity questions are resolved.

## Owner Scope
- Checkout frontend renders membership-discount preview state and totals returned by backend
- Frontend owns unavailable-reason copy mapping from normalized reason codes
- Frontend does not own local fallback pricing logic

## Dependencies
- Backend must return eligibility state, preview total, discount amount, and normalized reason codes
- Backend retains ownership of pricing correctness and final settlement logic

## Acceptance Criteria
- Eligible users see the backend-returned preview totals and discount state rendered accurately
- Ineligible users see the correct frontend-mapped unavailable reason
- The UI clearly marks preview values as estimates before submit

## Open Questions
- Which exact reason codes must be supported in the first release?
- Should analytics for unavailable reasons land in the same iteration?
