# Example: Incremental Checkout Coupon Demand

This example shows the smallest realistic `/focus-requirements` use case:

- the source demand is larger than one owner
- the current owner is only one side of the flow
- there are real dependencies and open questions
- the output is one true-source PRD plus two thin handoff summaries

## Inputs

- Reviewed source demand: `source-requirement.md`
- Current owner: `web-checkout`
- Workspace projects:
  - `checkout-web`
  - `shared-api-types`

## Outputs

- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

## What this example is demonstrating

- The source demand covers web, app, backend, and ops concerns
- `/focus-requirements` narrows it to only the `web-checkout` owner
- Backend API work stays in `Dependencies`
- App parity stays in `Out of Scope`
- Unknown coupon error copy is preserved in `Open Questions`
