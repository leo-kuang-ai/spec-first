# Candidate Enhancement

### Phase 2.46: Optional Candidate Enhancement

Full interactive runs may apply the problem-specific review prompts below to the private candidate before promotion. Headless and Lightweight skip this phase to keep their cost bounded. Dispatch generic read-only reviewers only when the Dispatch Authorization Boundary is satisfied; otherwise run the selected review inline or serially and label it non-independent.

- **performance_issue** → `references/agents/performance-oracle.md`
- **security_issue** → `references/agents/security-sentinel.md`
- **database_issue** → `references/agents/data-integrity-guardian.md`
- Any code-heavy issue → inspect the candidate's code examples and explanatory claims for speculative abstractions, redundant wrappers, dead branches, and just-in-case parameters. This is a read-only documentation review; do not invoke `spec-simplify-code` or mutate product code from this workflow.

Apply accepted suggestions only to `<private-scratch-dir>/learning-candidate.md` or `<private-scratch-dir>/concepts-candidate.md`. If either candidate changes, rerun the applicable frontmatter and claims checks plus semantic grounding for affected claims. No optional reviewer may edit a durable target or run after publication and still count toward the promotion decision.

## Applicable Specialized Local Prompts

Based on problem type, these local prompt assets can enhance documentation:

### Code Quality & Review
- **Read-only code simplification review**: Checks solution examples and documentation claims for unnecessary complexity without mutating product code
- **references/agents/pattern-recognition-specialist.md**: Identifies anti-patterns or repeating issues

### Specific Domain Experts
- **references/agents/performance-oracle.md**: Analyzes performance_issue category solutions
- **references/agents/security-sentinel.md**: Reviews security_issue solutions for vulnerabilities
- **references/agents/data-integrity-guardian.md**: Reviews database_issue migrations and queries

### Enhancement & Research
- **references/agents/best-practices-researcher.md**: Enriches solution with industry best practices
- **references/agents/framework-docs-researcher.md**: Links to framework/library documentation references

### When to Invoke
- **Auto-triggered** (optional): Generic subagents seeded with local prompts can review the private candidate before promotion
- **Manual trigger**: User can run surviving skills such as `spec-simplify-code` after `spec-compound` completes for deeper code review and mutation
