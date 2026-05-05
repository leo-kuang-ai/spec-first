# Router Candidate Policy Preview

> Scripts prepare candidate facts. Skill / LLM decides selected experts and final synthesis.

- Owner boundary: scripts_prepare_candidate_facts_llm_skill_decides
- Forbidden fields: selected_agents, final_verdict, confirmed_standards_write

## Router Output Shape

```json
{
  "candidate_agents": [],
  "reason_code": "",
  "budget_hint": "",
  "degraded_mode": {},
  "excluded_by_policy": []
}
```

## Scenario Matrix

| Scenario | Expected Candidate Agents |
| --- | --- |
| src/auth/session.ts | spec-security-reviewer, spec-correctness-reviewer, spec-testing-reviewer |
| openapi.yaml | spec-api-contract-reviewer, spec-testing-reviewer |
| migrations/20260505.sql | spec-data-migrations-reviewer, spec-data-integrity-guardian |
| skills/spec-plan/SKILL.md | spec-agent-native-reviewer, spec-coherence-reviewer, spec-code-simplicity-reviewer |
| src/ui/Widget.tsx | spec-julik-frontend-races-reviewer, spec-testing-reviewer, spec-design-lens-reviewer |
| docs/readme-typo.md | spec-coherence-reviewer |
| docs/typo.md low-risk | (none) |
