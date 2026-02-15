# Skill: code-review

## Trigger
- Stage: 04_implement (after code Skill)
- Command: `/spec-first:code-review`

## Phases
- P0: Locate changed files from git diff or TASK scope
- P1: Load review checklists from references/, FR/DS constraints
- P2: Generate review report against 4 dimensions (SOLID, security, performance, testing)
- P3: Confirm review findings with user
- P4: Write review results to findings.md
- P5: Update TASK status if review passed

## CLI Dependencies
- `spec-first metrics coverage`
- `spec-first matrix check`

## Output Paths
- `specs/{featureId}/findings.md`

## References
- `references/solid-checklist.md`
- `references/security-checklist.md`
- `references/performance-checklist.md`
- `references/testing-checklist.md`

## confirm_policy
- Recommended: assisted (review findings need human judgment)
