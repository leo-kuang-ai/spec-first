'use strict';

// spec-prd readiness 阻断分类法的单一真相源。
// check-prd-artifact.js 与 finalize-prd-artifact.js 共同消费本模块,
// 消除"什么是 blocker / receipt-only / checkpoint-exempt"语义横跨两模块的双归属
// 与 closure-blocker 子集内联数组的漂移风险。
//
// 边界:本模块只管 reason-code 的分类(哪些码属于哪个子集),不管谁 emit。
// finalize_required 属于 BLOCKING 但只由 finalize emit(ready-intent 缺失类),
// 不属于任何功能子集;LEGAL_DISPOSITIONS 等 closure-disposition 词分类是 OQ 剃刀概念,
// 不属本模块,保留在 check-prd-artifact.js。

// 全部阻断码(可执行真相)。prose 复述由 spec-prd-reason-code-parity 闸锁定 missing 方向;
// 整集 freeze 由 spec-prd-finalize.test.js 锁定。增删码须同步 prose 与 freeze 测试。
const BLOCKING_REASON_CODES = new Set([
  // 基础结构 / 声明类
  'machine_section_identity_missing',
  'forbidden_prds_path',
  'write_mode_undeclared',
  'clarification_evidence_undeclared',
  'clarification_trace_absent',
  'can_enter_spec_plan_undeclared',
  'preflight_sweep_closure_absent',
  'preflight_sweep_closure_blocked',
  'decision_card_undeclared',
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
  // 004 closure-contract:剃刀与 closure 矛盾类 blocker(只在 artifact 自称 ready/final 时生效)
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

// closure 矛盾类子集:用于检测 preflight_sweep_closure=closed 却仍有 closure blocker
// 的自相矛盾(触发 preflight_closure_contradicted)。这是 BLOCKING 的明确子集,
// 取代 check-prd-artifact.js 原 :1057-1062 的内联 8 码数组。
// 注意:不含 preflight_closure_contradicted 自身、outstanding_question_closure_undeclared
// (declaration 类)与 checkpoint_claims_ready(矛盾信号类),与前述内联数组行为一致。
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

// receipt-only 子集:ready_receipt_absent / ready_receipt_stale 只在 artifact 自称 ready
// 时才需确证;一个还没 ready 的 checkpoint 允许这两码存在而不阻断 closeout。
const RECEIPT_ONLY_REASONS = new Set([
  'ready_receipt_absent',
  'ready_receipt_stale',
]);

// checkpoint closeout 额外豁免:input-side 核算信号只在 PRD 自称 ready 时才需确证;
// 一个还没 ready 的 checkpoint 允许 input 扫描降级(仍在 grill 未读全 inputs)。
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
