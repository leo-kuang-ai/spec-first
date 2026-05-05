# Finding Compatibility Policy

> Workflow-native schema wins. Finding Core is a compatibility view for synthesis, not a replacement schema.

```json
{
  "schema_version": "spec-first.ecc-governance-preview.v1.finding-compatibility-policy",
  "generated_from": "scripts/generate-ecc-governance-preview.js",
  "boundary": "workflow_native_schema_wins",
  "finding_core_fields": [
    "severity",
    "confidence",
    "category",
    "title",
    "evidence",
    "impact",
    "recommendation",
    "suggested_tests",
    "not_reviewed"
  ],
  "preserve_native_fields": [
    "autofix_class",
    "owner",
    "finding_type",
    "deferred_questions",
    "residual_risks",
    "testing_gaps"
  ],
  "adapter_policy": "Finding Core is a compatibility view and must not rewrite native findings back into workflow source.",
  "evidence_policy": "findings without evidence are downgraded to advisory or rejected from blocking lists"
}
```
