# Agent And Capability Packs Preview

> Agent packs are logical governance groupings. Capability pack runtime delivery is `none_in_v1`.

| Pack | Priority | Type | Default Enabled | Workflows | Agents | Runtime Delivery |
| --- | --- | --- | --- | --- | --- | --- |
| product-scope-pack | P0 | core | true | spec-brainstorm, spec-doc-review, spec-plan | spec-product-lens-reviewer, spec-scope-guardian-reviewer, spec-spec-flow-analyzer | none_in_v1 |
| document-quality-pack | P0 | core | true | spec-doc-review, spec-plan | spec-coherence-reviewer, spec-feasibility-reviewer, spec-adversarial-document-reviewer, spec-security-lens-reviewer | none_in_v1 |
| engineering-quality-pack | P0 | core | true | spec-code-review, spec-debug, spec-work | spec-correctness-reviewer, spec-testing-reviewer, spec-maintainability-reviewer, spec-reliability-reviewer, spec-code-simplicity-reviewer, spec-adversarial-reviewer | none_in_v1 |
| architecture-contract-pack | P0 | core | true | spec-plan, spec-code-review | spec-architecture-strategist, spec-api-contract-reviewer, spec-repo-research-analyst, spec-git-history-analyzer | none_in_v1 |
| governance-pack | P0 | core | true | spec-skill-audit, spec-update, spec-compound, spec-code-review | spec-project-standards-reviewer, spec-agent-native-reviewer, spec-cli-readiness-reviewer, spec-cli-agent-readiness-reviewer, spec-learnings-researcher, spec-pattern-recognition-specialist | none_in_v1 |
| security-deep-pack | P1 | conditional | false | spec-code-review, spec-plan, spec-doc-review | spec-security-reviewer, spec-security-sentinel | none_in_v1 |
| data-pack | P1 | conditional | false | spec-plan, spec-code-review | spec-data-integrity-guardian, spec-data-migrations-reviewer, spec-data-migration-expert, spec-schema-drift-detector, spec-deployment-verification-agent | none_in_v1 |
| performance-pack | P1 | conditional | false | spec-code-review, spec-plan | spec-performance-reviewer, spec-performance-oracle | none_in_v1 |
| frontend-app-pack | P1 | conditional | false | spec-app-consistency-audit, spec-code-review, spec-doc-review | spec-design-lens-reviewer, spec-design-implementation-reviewer, spec-design-iterator, spec-swift-ios-reviewer, spec-julik-frontend-races-reviewer | none_in_v1 |
| language-pack | P1 | conditional | false | spec-code-review | spec-kieran-typescript-reviewer, spec-kieran-python-reviewer, spec-kieran-rails-reviewer | none_in_v1 |
| research-pack | P1 | conditional | false | spec-plan, spec-doc-review, spec-code-review | spec-best-practices-researcher, spec-framework-docs-researcher, spec-web-researcher, spec-session-historian | none_in_v1 |
| team-context-pack | P2 | optional | false | spec-brainstorm, spec-plan, spec-doc-review | spec-slack-researcher, spec-issue-intelligence-analyst, spec-previous-comments-reviewer, spec-pr-comment-resolver | none_in_v1 |
| external-design-pack | P2 | optional | false | spec-app-consistency-audit, spec-doc-review | spec-figma-design-sync | none_in_v1 |
| style-profile-pack | P3 | style_profile | false | spec-code-review, spec-doc-review | spec-dhh-rails-reviewer, spec-ankane-readme-writer | none_in_v1 |

## Excluded Domain References

- business operations
- media/growth
- finance
- logistics
- healthcare
- web3
