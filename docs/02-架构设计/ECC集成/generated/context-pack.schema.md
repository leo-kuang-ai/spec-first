# Context Pack Schema Preview

> Context packs bound evidence, freshness, trust, and allowed use for selected experts only.

```json
{
  "schema_version": "spec-first.ecc-governance-preview.v1.context-pack-schema-preview",
  "generated_from": "scripts/generate-ecc-governance-preview.js",
  "required_fields": [
    "agent_id",
    "workflow",
    "task",
    "inputs",
    "boundaries",
    "output_schema",
    "confidence_policy"
  ],
  "input_metadata_required": [
    "source",
    "freshness",
    "trust_level",
    "allowed_use",
    "not_reviewed"
  ],
  "allowed_use_values": [
    "primary_evidence",
    "supporting_evidence",
    "orientation_only",
    "checklist_reference_only"
  ],
  "trust_policy": "orientation_only or stale evidence cannot produce high-confidence blocker findings",
  "context_budget_policy": "selected experts only; never include all ECC skills or agents"
}
```
