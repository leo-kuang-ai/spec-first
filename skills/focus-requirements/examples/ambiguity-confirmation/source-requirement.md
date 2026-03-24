# Reviewed Source Requirement

## Background

Checkout should support membership discount preview before order submit.
Today the final payable amount is only visible at submit time.

## Requirement Summary

Users should be able to:
- see whether membership discount applies in checkout
- preview the discounted payable amount
- understand why discount is unavailable if they are not eligible

## Requested Changes

### Checkout frontend
- show membership discount block in order summary
- show discounted payable amount when eligible
- show unavailable reason when not eligible

### Pricing / backend
- return discount eligibility
- return discount amount and preview total
- enforce the real amount again during submit

## Constraints

- Preview amount is not final settlement
- Eligibility may depend on user level and campaign rules
- Existing order summary already calculates some local display fields

## Notes From Review

- It is not fully settled whether frontend owns any local fallback price calculation
- It is not fully settled whether ineligible-state copy comes from backend code or frontend mapping
- Product success language says "users can trust the preview", but does not define whether that means UI accuracy only or pricing accuracy end to end
