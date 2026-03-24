# Side Requirements

## Owner Scope
- Add coupon preview interaction and price estimate rendering to `web-checkout` before order submission

## In Scope
- Coupon input area on web checkout
- Coupon preview request and result rendering
- Failure-state rendering for invalid, expired, and threshold-not-met coupons
- Coupon removal and price reset

## Out of Scope
- Backend preview API implementation
- Final coupon enforcement during order submit
- App parity
- Admin coupon configuration

## Dependencies
- Backend preview API and response schema
- Product confirmation for final failure-state copy
- Campaign-side coupon rule maintenance
