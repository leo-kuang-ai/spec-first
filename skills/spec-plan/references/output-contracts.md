# Planning Output Contracts

## Owned

Classify low-risk solo planning output as Direct, Chat brief, or Durable before expensive research or dispatch.

## Not Owned

Product decisions, implementation, repository mutation, or execution authorization.

## Trigger

Read when the output-contract gate in `spec-plan/SKILL.md` selects Direct or Chat brief.

## Fallback

If the classification is uncertain, choose Durable and continue the normal planning workflow.

**Direct** is a one-pass result with no user decision and no risk surface. **Chat brief** allows at most one decision and no risk surface. **Durable** is required for ambiguity, multi-pass verification, user-requested files or plans, pipeline/headless execution, existing-plan continuation, or authentication, payment, migration, and external contracts.
