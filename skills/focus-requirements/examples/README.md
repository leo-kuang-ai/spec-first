# /focus-requirements Examples

This directory contains reference examples for the three main operating modes of
`/focus-requirements`.

## 1. Complex incremental demand

Use this when you want to see how the skill narrows a reviewed requirement that spans
multiple owners, dependencies, and open questions.

- [incremental-checkout-coupon](./incremental-checkout-coupon/README.md)

What it demonstrates:
- owner-scoped narrowing from a multi-side demand
- dependencies isolated from owned scope
- app and backend work kept out of the owner PRD
- non-blocking questions preserved without over-expanding scope

## 2. Simple direct narrowing

Use this when you want to see the fast path: one owner, one surface, almost no ambiguity,
and direct PRD drafting without multi-round confirmation.

- [simple-profile-copy-update](./simple-profile-copy-update/README.md)

What it demonstrates:
- direct narrowing mode
- minimal dependencies
- obvious acceptance boundary
- thin handoff outputs from a small incremental change

## 3. Ambiguity-triggered confirmation

Use this when you want to see how the skill should ask questions only when one of the
three hard ambiguity triggers is present.

- [ambiguity-confirmation](./ambiguity-confirmation/README.md)

What it demonstrates:
- `Owner Boundary Ambiguity`
- `Dependency Ownership Ambiguity`
- `Acceptance Boundary Ambiguity`
- minimum question sequence before drafting resumes

## How to use these examples

If you are:
- designing the skill: read all three
- validating direct mode: start with `simple-profile-copy-update`
- validating owner-boundary handling: start with `incremental-checkout-coupon`
- validating AskUserQuestion posture: start with `ambiguity-confirmation`
