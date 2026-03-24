# Reviewed Source Requirement

## Background

The current checkout flow does not support applying platform coupons before order submission.
Users can only see the final discount result after the order is created, which causes confusion,
support tickets, and a measurable checkout drop-off on promotion days.

This iteration introduces coupon preview during checkout.

## Requirement Summary

Users should be able to:
- enter a coupon code on the checkout page
- validate the coupon before placing the order
- see updated payable amount, discount amount, and failure reason
- remove an applied coupon and restore the original payable amount

## Affected Sides

### Web checkout
- add coupon input area in checkout
- call validation API when user applies coupon
- render success, invalid, expired, and threshold-not-met states
- update order summary price preview
- support removing the coupon

### App checkout
- achieve behavior parity with web in a later app release

### Backend
- provide `POST /checkout/coupon/preview`
- return normalized coupon validation result
- return discounted totals for display only
- enforce final validation again during order submit

### Ops / configuration
- campaign team needs coupon availability and threshold rules in admin
- monitoring for coupon preview failure rate is required

## Constraints

- Coupon preview must not create an order draft
- Price preview must be clearly marked as pre-submit estimate
- Final payable amount is still determined at order submit time
- Promotion events can create traffic spikes

## Success Expectations

- users can preview coupon effect before submit
- support tickets about "coupon not applied" should decrease
- checkout conversion on coupon traffic should improve

## Notes From Review

- App parity is desired but not required for the first web rollout
- Backend API naming is agreed in principle but payload details are not finalized
- Error copy for invalid vs expired coupon still needs product confirmation
