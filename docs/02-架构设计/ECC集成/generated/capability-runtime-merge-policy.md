# Capability Runtime Merge Policy Preview

> V1 does not deliver runtime capability packs. Future delivery must be pack-gated, source-generated, preview-first, and cleanable.

```json
{
  "instructions": "managed_marker_merge",
  "config": "add_only_merge",
  "commands": "idea_reference_only",
  "runtime_assets": "pack_gated_source_generator_only",
  "preview": "required_before_apply",
  "clean": "future_state_aware_clean",
  "doctor": "future_state_aware_doctor"
}
```

| Pack | Default Enabled | Runtime Delivery | Future Requires |
| --- | --- | --- | --- |
| product-scope-pack | true | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| document-quality-pack | true | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| engineering-quality-pack | true | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| architecture-contract-pack | true | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| governance-pack | true | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| security-deep-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| data-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| performance-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| frontend-app-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| language-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| research-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| team-context-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| external-design-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
| style-profile-pack | false | none_in_v1 | pilot_quality_gain, pack_state, doctor, clean, preview_first_merge |
