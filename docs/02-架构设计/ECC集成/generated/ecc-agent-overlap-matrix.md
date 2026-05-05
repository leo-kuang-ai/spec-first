# ECC Agent Overlap Matrix

> ECC agents are capability samples. Direct matches enhance existing spec-first agents; they do not create new runtime agents.

- ECC agent count: 48
- ECC source revision: 841beea45cb25ba51f29fa45b7e272938d19b80a

| ECC Agent | Spec-First Target | Status | Action | Priority | Reason |
| --- | --- | --- | --- | --- | --- |
| a11y-architect | spec-design-lens-reviewer, spec-design-implementation-reviewer | direct_match | enhance_existing | P1 | same R&D review domain already covered by spec-first source agents |
| architect | spec-architecture-strategist | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| build-error-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; keep checklist/reference until stack opt-in |
| chief-of-staff | (none) | missing_in_spec_first | reference_only | P3 | organizational operations role outside current R&D expert pack scope |
| code-architect | spec-architecture-strategist | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| code-explorer | spec-repo-research-analyst | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| code-reviewer | spec-correctness-reviewer, spec-testing-reviewer, spec-maintainability-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| code-simplifier | spec-code-simplicity-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| comment-analyzer | spec-pr-comment-resolver, spec-previous-comments-reviewer | direct_match | enhance_existing | P2 | same R&D review domain already covered by spec-first source agents |
| conversation-analyzer | spec-session-historian | direct_match | enhance_existing | P1 | same R&D review domain already covered by spec-first source agents |
| cpp-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| cpp-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| csharp-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| dart-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| database-reviewer | spec-data-integrity-guardian, spec-data-migrations-reviewer | direct_match | enhance_existing | P1 | same R&D review domain already covered by spec-first source agents |
| doc-updater | spec-coherence-reviewer, spec-learnings-researcher | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| docs-lookup | spec-framework-docs-researcher, spec-web-researcher | direct_match | enhance_existing | P1 | same R&D review domain already covered by spec-first source agents |
| e2e-runner | spec-testing-reviewer, spec-deployment-verification-agent | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| flutter-reviewer | spec-design-implementation-reviewer | partial_match | optional_lens | P2 | frontend/app expertise partially covered by design and mobile reviewers |
| gan-evaluator | (none) | missing_in_spec_first | optional_profile | P3 | experimental harness reference only |
| gan-generator | (none) | missing_in_spec_first | optional_profile | P3 | experimental harness reference only |
| gan-planner | (none) | missing_in_spec_first | optional_profile | P3 | experimental harness reference only |
| go-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| go-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| harness-optimizer | spec-agent-native-reviewer, spec-cli-agent-readiness-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| healthcare-reviewer | (none) | missing_in_spec_first | reference_only | P3 | healthcare domain excluded from current R&D-focused integration |
| java-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| java-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| kotlin-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| kotlin-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| loop-operator | (none) | missing_in_spec_first | optional_profile | P3 | autonomous loop reference for spec-optimize only |
| opensource-forker | (none) | missing_in_spec_first | optional_lens | P2 | open-source release capability requires explicit opt-in |
| opensource-packager | (none) | missing_in_spec_first | optional_lens | P2 | open-source release capability requires explicit opt-in |
| opensource-sanitizer | (none) | missing_in_spec_first | optional_lens | P2 | open-source release capability requires explicit opt-in |
| performance-optimizer | spec-performance-reviewer, spec-performance-oracle | direct_match | enhance_existing | P1 | same R&D review domain already covered by spec-first source agents |
| planner | spec-architecture-strategist, spec-feasibility-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| pr-test-analyzer | spec-testing-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| python-reviewer | spec-kieran-python-reviewer | partial_match | enhance_existing | P1 | partially covered by existing generalized or personal-name spec-first reviewer |
| pytorch-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| refactor-cleaner | spec-maintainability-reviewer, spec-code-simplicity-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| rust-build-resolver | (none) | missing_in_spec_first | optional_lens | P2 | build resolver capability; stack-specific opt-in only |
| rust-reviewer | (none) | missing_in_spec_first | optional_lens | P2 | language reviewer not present in current source agents |
| security-reviewer | spec-security-reviewer, spec-security-lens-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| seo-specialist | (none) | missing_in_spec_first | reference_only | P3 | media/growth domain excluded from current R&D-focused integration |
| silent-failure-hunter | spec-reliability-reviewer, spec-correctness-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| tdd-guide | spec-testing-reviewer | direct_match | enhance_existing | P0 | same R&D review domain already covered by spec-first source agents |
| type-design-analyzer | spec-kieran-typescript-reviewer, spec-api-contract-reviewer | partial_match | enhance_existing | P0 | partially covered by existing generalized or personal-name spec-first reviewer |
| typescript-reviewer | spec-kieran-typescript-reviewer | partial_match | enhance_existing | P1 | partially covered by existing generalized or personal-name spec-first reviewer |
