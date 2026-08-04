'use strict';

const CONTRACT_RESET_ARMS = Object.freeze(['baseline', 'phase1_control', 'candidate']);
const CONTRACT_RESET_PATCH_CHAINS = Object.freeze({
  baseline: Object.freeze([]),
  phase1_control: Object.freeze(['phase1_control']),
  candidate: Object.freeze(['phase1_control', 'candidate']),
});
const ISOLATION_SCHEMA_VERSION = 'contract-reset-isolation-probe/v1';
const ISOLATION_PROBE_NAMES = Object.freeze([
  'absolute',
  'parent_traversal',
  'symlink',
  'control',
  'sibling',
]);
const ISOLATION_DENY_CODES = Object.freeze(['EACCES', 'EPERM']);
const ISOLATION_PRIMITIVES = Object.freeze(['macos-sandbox-exec']);
const RUN_AUDIT_TOP_LEVEL_CONTRACTS = Object.freeze([
  Object.freeze({ name: 'source-manifest.json', artifactType: 'generated' }),
  Object.freeze({ name: 'materialization-verification.json', artifactType: 'confirmed' }),
  Object.freeze({ name: 'control.patch', artifactType: 'generated' }),
  Object.freeze({ name: 'candidate.patch', artifactType: 'generated' }),
  Object.freeze({ name: 'promotion-holdout-commitment.json', artifactType: null }),
  Object.freeze({ name: 'run-facts.json', artifactType: null }),
]);
const RETAINED_EVIDENCE_FILE_CONTRACTS = Object.freeze({
  sanitized_product_contract: Object.freeze({
    artifactType: 'generated',
    hashKey: 'native_artifact',
  }),
  blind_packet: Object.freeze({ artifactType: 'generated', hashKey: 'blind_packet' }),
  event_log: Object.freeze({ artifactType: 'generated', hashKey: 'event_log' }),
  grading_notes: Object.freeze({ artifactType: 'advisory', hashKey: 'grading_notes' }),
});

module.exports = {
  CONTRACT_RESET_ARMS,
  CONTRACT_RESET_PATCH_CHAINS,
  ISOLATION_DENY_CODES,
  ISOLATION_PRIMITIVES,
  ISOLATION_PROBE_NAMES,
  ISOLATION_SCHEMA_VERSION,
  RETAINED_EVIDENCE_FILE_CONTRACTS,
  RUN_AUDIT_TOP_LEVEL_CONTRACTS,
};
