## Inferred But Rejected

### language-policy

- Reason: Language is a per-project configuration option managed by init, not a universally enforceable hard rule across all repos.
- Outcome: Rejected from this run. May be added as a manual custom standard if the project owner decides to formalize it.

### prose-eval-boundary

- Reason: The rule about not verifying prose changes via same-session typed-agent calls is already covered by governance RULE-GOVERNANCE-001 (do not edit runtime copies as source). Adding a duplicate standard would create a second source of truth.
- Outcome: Rejected. Cross-reference: `docs/specs/governance.md`.
