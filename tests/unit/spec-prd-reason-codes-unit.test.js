'use strict';

// U1: reason-codes 分类法模块单元测试。
// 锁定分类器语义真值表 + 三个子集 ⊆ BLOCKING 不变量 + 子集两两不相交。
// 这是迁移后的护栏:closure-blocker 子集从内联数组改为派生分类器,
// 若子集成员错配会静默改变 preflight_closure_contradicted 触发条件,本测试护栏之。
// BLOCKING_REASON_CODES 整集 freeze 由 spec-prd-finalize.test.js (U7/R20) 负责;
// 本模块不重复锁数量,避免每次合法增码都在两处同步。

const {
  BLOCKING_REASON_CODES,
  CLOSURE_BLOCKER_REASON_CODES,
  RECEIPT_ONLY_REASONS,
  CHECKPOINT_INPUT_SCAN_EXEMPT,
  isClosureBlocker,
  isReceiptOnly,
  isCheckpointInputScanExempt,
} = require('../../skills/spec-prd/scripts/lib/reason-codes');

const ALL_CODES = [...BLOCKING_REASON_CODES].sort();

describe('reason-codes 分类器真值表', () => {
  test('isClosureBlocker 对 8 个 closure-blocker 码返回 true', () => {
    [
      'open_oq_without_owner_closure',
      'how_pushdown_touches_what',
      'blocking_outstanding_question_present',
      'planning_invention_question_present',
      'unclosed_owner_question_present',
      'owner_decision_trace_required_but_absent',
      'design_unread_without_owner_acceptance',
      'design_partial_coverage_unaccepted',
    ].forEach((code) => expect(isClosureBlocker(code)).toBe(true));
  });

  test('isClosureBlocker 对非 closure-blocker 的 BLOCKING 码返回 false', () => {
    ALL_CODES
      .filter((c) => !CLOSURE_BLOCKER_REASON_CODES.has(c))
      .forEach((code) => expect(isClosureBlocker(code)).toBe(false));
  });

  test('isReceiptOnly 对 2 个 receipt 码返回 true', () => {
    expect(isReceiptOnly('ready_receipt_absent')).toBe(true);
    expect(isReceiptOnly('ready_receipt_stale')).toBe(true);
  });

  test('isReceiptOnly 对非 receipt 码返回 false', () => {
    ALL_CODES
      .filter((c) => !RECEIPT_ONLY_REASONS.has(c))
      .forEach((code) => expect(isReceiptOnly(code)).toBe(false));
  });

  test('isCheckpointInputScanExempt 对 2 个 exempt 码返回 true', () => {
    expect(isCheckpointInputScanExempt('input_scan_degraded')).toBe(true);
    expect(isCheckpointInputScanExempt('input_refs_unavailable')).toBe(true);
  });

  test('isCheckpointInputScanExempt 对非 exempt 码返回 false', () => {
    ALL_CODES
      .filter((c) => !CHECKPOINT_INPUT_SCAN_EXEMPT.has(c))
      .forEach((code) => expect(isCheckpointInputScanExempt(code)).toBe(false));
  });

  test('分类器对未知码返回 false,不抛异常', () => {
    expect(isClosureBlocker('nonexistent_code')).toBe(false);
    expect(isReceiptOnly('nonexistent_code')).toBe(false);
    expect(isCheckpointInputScanExempt('nonexistent_code')).toBe(false);
  });

  test('finalize_required 属于 BLOCKING 但不属于任何功能子集(emit 归 finalize,lib 只管分类)', () => {
    expect(BLOCKING_REASON_CODES.has('finalize_required')).toBe(true);
    expect(isClosureBlocker('finalize_required')).toBe(false);
    expect(isReceiptOnly('finalize_required')).toBe(false);
    expect(isCheckpointInputScanExempt('finalize_required')).toBe(false);
  });
});

describe('reason-codes 子集不变量', () => {
  test('三个子集都是 BLOCKING_REASON_CODES 的子集', () => {
    [...CLOSURE_BLOCKER_REASON_CODES].forEach((c) => expect(BLOCKING_REASON_CODES.has(c)).toBe(true));
    [...RECEIPT_ONLY_REASONS].forEach((c) => expect(BLOCKING_REASON_CODES.has(c)).toBe(true));
    [...CHECKPOINT_INPUT_SCAN_EXEMPT].forEach((c) => expect(BLOCKING_REASON_CODES.has(c)).toBe(true));
  });

  test('三个子集两两不相交(同码不属多个分类)', () => {
    const closure = [...CLOSURE_BLOCKER_REASON_CODES];
    const receipt = [...RECEIPT_ONLY_REASONS];
    const exempt = [...CHECKPOINT_INPUT_SCAN_EXEMPT];
    receipt.forEach((c) => expect(closure).not.toContain(c));
    exempt.forEach((c) => expect(closure).not.toContain(c));
    exempt.forEach((c) => expect(receipt).not.toContain(c));
  });

  test('CLOSURE_BLOCKER 子集规模为 8(与前述内联数组一致)', () => {
    expect(CLOSURE_BLOCKER_REASON_CODES.size).toBe(8);
  });
});