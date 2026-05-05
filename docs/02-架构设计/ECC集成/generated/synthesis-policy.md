# Skill Synthesis Policy

> Final verdict belongs to the active Skill, not to an individual expert or deterministic router.

```json
{
  "schema_version": "spec-first.ecc-governance-preview.v1.synthesis-policy",
  "generated_from": "scripts/generate-ecc-governance-preview.js",
  "owner": "Skill / LLM",
  "required_operations": [
    "merge",
    "dedupe",
    "rank",
    "downgrade",
    "upgrade",
    "reject",
    "adopt",
    "summarize"
  ],
  "conflict_priority": [
    "user_current_instruction",
    "repo_profile_confirmed_standards",
    "pinned_team_standards",
    "code_facts_or_graph_facts",
    "docs_readme_manifest",
    "agent_finding",
    "external_best_practice"
  ],
  "anti_patterns": [
    "concatenate_agent_longform_without_judgment",
    "agent_outputs_final_verdict",
    "style_profile_creates_blocker",
    "advisory_finding_writes_confirmed_standard"
  ]
}
```
