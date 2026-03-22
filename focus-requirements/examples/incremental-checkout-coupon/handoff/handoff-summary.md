# Handoff Summary

## Requirement Summary
- Source requirement: introduce coupon preview before checkout submit
- Current owner: `web-checkout`
- Workspace: `checkout-web`, `shared-api-types`

## Key Acceptance Criteria
- Valid coupon updates estimated payable amount before submit
- Invalid coupon states are rendered explicitly and do not corrupt totals
- Removing a coupon restores original price preview

## Open Questions
- Blocking:
  - backend response contract for coupon failure states is not finalized
- Non-blocking:
  - final failure-state copy
  - whether analytics for preview failures lands in this iteration

## Recommended Next Step
- /plan-ceo-review
- then /plan-eng-review
