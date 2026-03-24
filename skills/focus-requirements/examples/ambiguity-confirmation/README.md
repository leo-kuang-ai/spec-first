# Example: Ambiguity Confirmation

This example shows the confirmation path for `/focus-requirements`.

It demonstrates how the skill should ask only the minimum questions needed when it
hits one of the three hard ambiguity triggers:

- `Owner Boundary Ambiguity`
- `Dependency Ownership Ambiguity`
- `Acceptance Boundary Ambiguity`

The point of this example is not the final PRD itself. The point is the question
sequence and the shape of the narrowing.

## Scenario

- Source demand spans checkout UI, order pricing, and coupon validation
- The current owner is roughly "checkout frontend", but the exact rendering vs pricing
  responsibility is unclear
- The backend contract is only partially defined
- The acceptance boundary could mean either "UI renders correctly" or "price preview is
  numerically trustworthy end to end"

## Files

- `source-requirement.md`
- `question-sequence.md`
- `resolved-focus-requirements.md`

## What this example demonstrates

- Ask only when a hard ambiguity trigger is present
- Ask in the order: owner boundary -> dependency ownership -> acceptance boundary
- Keep normal open questions in the document instead of over-interviewing
