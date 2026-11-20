'use strict';

// spec-prd readiness single truth source for blocking classification.
// check-prd-artifact.js and finalize-prd-artifact.js both consume this module.
// Eliminate the semantic cross-module ownership of "what is a blocker / receipt-only / checkpoint-exempt"
// Drift risk of inlined array within the closure-blocker subset.
//
// Boundary: This module only handles classification of reason-code (which codes belong to which subset), and does not concern itself with who emits them.
// finalize_required belongs to BLOCKING but is only triggered by finalize emit (when ready-intent is missing).
// Not part of any functional subset; LEGAL_DISPOSITIONS and similar closure-disposition terms belong to the OQ Razor concept.
// Not within this module; retained in check-prd-artifact.js.

// All block codes (executable truth). Prose reiterates the missing direction locked by the spec-prd-reason-code-parity gate;
// The entire set of freeze is locked by spec-prd-finalize.test.js. Addition and deletion of codes must be synchronized with prose and freeze testing.
const BLOCKING_REASON_CODES = new Set([
  // Base Structure / Declaration Class
  'machine_section_identity_missing',
  'core_section_missing',
  'requirements_row_missing',
  'acceptance_example_row_missing',
  'requirement_acceptance_trace_missing',
  'forbidden_prds_path',
  'write_mode_undeclared',
  'clarification_evidence_undeclared',
  'clarification_trace_absent',
  'can_enter_spec_plan_undeclared',
  'preflight_sweep_closure_absent',
  'preflight_sweep_closure_blocked',
  'decision_card_undeclared',
  'decision_card_path_mismatch',
  'design_source_inventory_undeclared',
  'design_source_coverage_undeclared',
  'design_sources_read_undeclared',
  'design_sources_unread_undeclared',
  'design_source_unaccounted',
  'input_refs_unavailable',
  'input_scan_degraded',
  'prd_readiness_declarations_evaded',
  'ready_receipt_absent',
  'ready_receipt_stale',
  'finalize_required',
  // 004 closure-contract: Razor and closure contradiction class blocker (effective only when artifact declares itself ready/final)
  'outstanding_question_closure_undeclared',
  'blocking_outstanding_question_present',
  'planning_invention_question_present',
  'unclosed_owner_question_present',
  'open_oq_without_owner_closure',
  'how_pushdown_touches_what',
  'owner_decision_trace_required_but_absent',
  'design_unread_without_owner_acceptance',
  'design_partial_coverage_unaccepted',
  'preflight_closure_contradicted',
  'checkpoint_claims_ready',
]);

// closure contradiction subset: used to detect preflight_sweep_closure=closed yet still having a closure blocker
// self-contradictory (triggers preflight_closure_contradicted)This is a clear subset of BLOCKING.
// Replace the inline 8-byte array at original:1057-1062 in check-prd-artifact.js.
// Note: Excludes preflight_closure_contradicted itself, outstanding_question_closure_undeclared
// (declaration class) and checkpoint_claims_ready (contradiction signal class) behave consistently with the aforementioned inline array behavior.
const CLOSURE_BLOCKER_REASON_CODES = new Set([
  'open_oq_without_owner_closure',
  'how_pushdown_touches_what',
  'blocking_outstanding_question_present',
  'planning_invention_question_present',
  'unclosed_owner_question_present',
  'owner_decision_trace_required_but_absent',
  'design_unread_without_owner_acceptance',
  'design_partial_coverage_unaccepted',
]);

// receipt-only subset: ready_receipt_absent / ready_receipt_stale — artifact claims only that it is ready
// Only when ready should it be verified; a checkpoint that is not yet ready allows these two codes to coexist without blocking closeout.
const RECEIPT_ONLY_REASONS = new Set([
  'ready_receipt_absent',
  'ready_receipt_stale',
]);

// checkpoint closeout additional exemption: input-side accounting signal needs confirmation only when PRD declares ready;
// A checkpoint that is not yet ready allows input scan downgrade (still not having read all inputs in grill).
const CHECKPOINT_INPUT_SCAN_EXEMPT = new Set([
  'input_scan_degraded',
  'input_refs_unavailable',
]);

function isClosureBlocker(code) {
  return CLOSURE_BLOCKER_REASON_CODES.has(code);
}

function isReceiptOnly(code) {
  return RECEIPT_ONLY_REASONS.has(code);
}

function isCheckpointInputScanExempt(code) {
  return CHECKPOINT_INPUT_SCAN_EXEMPT.has(code);
}

module.exports = {
  BLOCKING_REASON_CODES,
  CLOSURE_BLOCKER_REASON_CODES,
  RECEIPT_ONLY_REASONS,
  CHECKPOINT_INPUT_SCAN_EXEMPT,
  isClosureBlocker,
  isReceiptOnly,
  isCheckpointInputScanExempt,
};
