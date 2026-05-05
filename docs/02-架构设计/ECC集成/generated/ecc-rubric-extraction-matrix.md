# ECC Rubric Extraction Matrix

> Stores source-attributed rubric candidates only. It does not copy ECC skill bodies into spec-first prompts.

- Total ECC skills scanned: 182
- High-value samples: 27
- Excluded references: 23

| ECC Skill | Target Surface | Quality Node | Rubric Type | Action | Freshness | Not Adopted Reason |
| --- | --- | --- | --- | --- | --- | --- |
| accessibility | spec-design-lens-reviewer | Review | accessibility | agent_enhancement | current_source_read |  |
| ai-regression-testing | spec-testing-reviewer | Review | testing | rubric_reference | current_source_read |  |
| api-design | spec-api-contract-reviewer | Plan | api_contract | agent_enhancement | current_source_read |  |
| architecture-decision-records | spec-architecture-strategist | Plan | architecture | rubric_reference | current_source_read |  |
| article-writing |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| browser-qa | spec-testing-reviewer | Review | e2e_testing | rubric_reference | current_source_read |  |
| click-path-audit | spec-spec-flow-analyzer | Spec | user_flow | rubric_reference | current_source_read |  |
| clickhouse-io | spec-data-integrity-guardian | Code | data_integrity | rubric_reference | current_source_read |  |
| code-tour | spec-repo-research-analyst | Codebase | repo_research | rubric_reference | current_source_read |  |
| content-engine |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| content-hash-cache-pattern |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| context-budget | spec-agent-native-reviewer | Review | context_governance | agent_enhancement | current_source_read |  |
| customs-trade-compliance |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| database-migrations | spec-data-migrations-reviewer | Code | data_migration | agent_enhancement | current_source_read |  |
| deep-research | spec-best-practices-researcher | Plan | research | rubric_reference | current_source_read |  |
| defi-amm-security |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| design-system | spec-design-lens-reviewer | Plan | design_system | rubric_reference | current_source_read |  |
| documentation-lookup | spec-framework-docs-researcher | Plan | research | rubric_reference | current_source_read |  |
| e2e-testing | spec-testing-reviewer | Review | e2e_testing | rubric_reference | current_source_read |  |
| energy-procurement |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| finance-billing-ops |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| frontend-patterns | spec-design-implementation-reviewer | Code | frontend | agent_enhancement | current_source_read |  |
| healthcare-cdss-patterns |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| healthcare-emr-patterns |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| healthcare-eval-harness |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| healthcare-phi-compliance |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| hexagonal-architecture | spec-architecture-strategist | Plan | architecture | rubric_reference | current_source_read |  |
| hipaa-compliance |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| inventory-demand-planning |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| investor-materials |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| investor-outreach |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| lead-intelligence |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| logistics-exception-management |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| market-research |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| mcp-server-patterns | spec-cli-readiness-reviewer | Plan | tooling | rubric_reference | current_source_read |  |
| postgres-patterns | spec-data-integrity-guardian | Code | data_integrity | rubric_reference | current_source_read |  |
| production-scheduling |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| repo-scan | spec-repo-research-analyst | Codebase | repo_research | rubric_reference | current_source_read |  |
| safety-guard | spec-security-lens-reviewer | Plan | security | agent_enhancement | current_source_read |  |
| search-first | spec-web-researcher | Plan | research | rubric_reference | current_source_read |  |
| security-review | spec-security-reviewer | Review | security | agent_enhancement | current_source_read |  |
| security-scan | spec-security-sentinel | Review | security | agent_enhancement | current_source_read |  |
| seo |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| skill-comply | spec-agent-native-reviewer | Review | skill_governance | agent_enhancement | current_source_read |  |
| skill-stocktake | spec-cli-agent-readiness-reviewer | Review | skill_inventory | rubric_reference | current_source_read |  |
| social-graph-ranker |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| tdd-workflow | spec-testing-reviewer | Code | testing | agent_enhancement | current_source_read |  |
| verification-loop | spec-deployment-verification-agent | Review | verification | rubric_reference | current_source_read |  |
| video-editing |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
| videodb |  | Excluded Domain Reference | excluded_domain_reference | rejected | current_source_read | non-R&D domain or media/growth capability outside current spec-first integration scope |
