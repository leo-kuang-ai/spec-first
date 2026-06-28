'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildReport,
  BLOCKING_REASON_CODES,
} = require('../../skills/spec-prd/scripts/check-prd-artifact');
const { finalizePrd } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');

const FINALIZE_SCRIPT = path.join(__dirname, '..', '..', 'skills', 'spec-prd', 'scripts', 'finalize-prd-artifact.js');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-finalize-'));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function validReadyIntentPrd(extraFrontmatter = '') {
  return `---
artifact_kind: prd-requirements
spec_id: finalize-fixture
title: Finalize Fixture
date: 2026-06-25
${extraFrontmatter}---

# Finalize Fixture

## Summary

一个用于验证 producer-local finalize 的 PRD。

## Change Delta

replace 当前入口。

## Requirements

| ID | Priority | Requirement |
|---|---|---|
| R-10 | P0 | 展示新页面 |

## Acceptance Examples

| ID | Covers | Example |
|---|---|---|
| AE-10 | R-10 | 打开入口后展示新页面 |

## Scope Boundaries

In scope: 新页面。

## Evidence And Assumptions

| Type | Item | Evidence |
|---|---|---|
| confirmed-source | 当前入口存在 | source |

## Readiness Self-Check

- write_mode: final-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: yes
- preflight_sweep_closure: closed
- decision_card_highest_risk_gap: owner 确认持仓接口口径
- decision_card_next_action: final-prd
- decision_card_why_no_invention: 三个 load-bearing OQ 已 owner 闭合,plan 无需发明 WHAT
`;
}

describe('spec-prd producer-local finalize', () => {
  test('checker flags ready self-declaration without a current receipt', () => {
    const report = buildReport('docs/brainstorms/finalize-fixture-requirements.md', validReadyIntentPrd('status: ready-for-planning\n'));

    expect(report.facts.ready_claim_present).toBe(true);
    expect(report.facts.ready_receipt_present).toBe(false);
    expect(report.facts.blocking_reason_codes).toContain('ready_receipt_absent');
  });

  test('finalize check-only blocks frontmatter ready self-declaration without receipt', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'self-ready-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd('status: ready-for-planning\n'));

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.blocking_reason_codes).toContain('ready_receipt_absent');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // 写入模式首次写 receipt 不死锁:声称 ready 但 receipt 不存在时,写入应允许(check-only 才阻断)。
  // 修复 2026-06-28 日志暴露的循环依赖:旧逻辑 ready_receipt_absent 进 blockingReasons → can_finalize=false → 永远写不了 receipt。
  test('finalize WRITE mode breaks the ready_receipt_absent deadlock (first receipt write allowed)', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'first-receipt-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd('status: ready-for-planning\n'));

      // check-only 仍阻断(矛盾态预警)
      const preview = finalizePrd(prdPath, [], { checkOnly: true });
      expect(preview.can_finalize).toBe(false);

      // 写入模式:首次写 receipt 允许,不死锁
      const wrote = finalizePrd(prdPath, []);
      expect(wrote.can_finalize).toBe(true);
      expect(wrote.status).toBe('finalized');
      expect(wrote.wrote_ready_receipt).toBe(true);

      // 写入后 receipt 已存在,check-only 通过
      const after = finalizePrd(prdPath, [], { checkOnly: true });
      expect(after.can_finalize).toBe(true);
      expect(after.blocking_reason_codes).not.toContain('ready_receipt_absent');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize refuses PRDs with producer blocking findings', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'bad-requirements.md');

    try {
      write(prdPath, `---
artifact_kind: prd-requirements
spec_id: bad
title: Bad
date: 2026-06-25
---

# Bad

## Summary

缺少核心 section 和 readiness 声明。
`);

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.blocking_reason_codes).toEqual(expect.arrayContaining([
        'core_section_missing',
        'write_mode_undeclared',
        'can_enter_spec_plan_undeclared',
      ]));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize blocks final PRDs when preflight sweep closure is blocked', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'blocked-preflight-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd().replace(
        '- preflight_sweep_closure: closed',
        '- preflight_sweep_closure: blocked',
      ));

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.closeout_blocking_reason_codes).toContain('preflight_sweep_closure_blocked');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize blocks closeout when any source input scan degrades', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'degraded-input-requirements.md');
    const readableInput = path.join(tempDir, 'source_docs', 'context.md');
    const missingInput = path.join(tempDir, 'source_docs', 'missing.md');

    try {
      write(prdPath, validReadyIntentPrd());
      write(readableInput, 'source evidence without design refs\n');

      const receipt = finalizePrd(prdPath, [readableInput, missingInput], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.closeout_blocking_reason_codes).toContain('input_scan_degraded');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize blocks final design PRDs when no source input scan was attempted', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'design-no-input-scan-requirements.md');
    const designInput = path.join(tempDir, 'source_docs', 'design.md');
    const designPrd = validReadyIntentPrd().replace('## Readiness Self-Check', [
      '## Design Source Coverage',
      'design_source_inventory:',
      '- source_or_node: Figma node 1:2',
      '  read_status: read',
      '',
      'design_sources_read:',
      '- source_docs/design.md -> Design Source Coverage -> source-candidate/provider_untrusted',
      '',
      'design_sources_unread:',
      '- none',
      '',
      'design_source_coverage: read status confirmed',
      '',
      '## Readiness Self-Check',
    ].join('\n'));

    try {
      write(prdPath, designPrd);
      write(designInput, 'Figma node 1:2\n');

      const withoutInputs = finalizePrd(prdPath, [], { checkOnly: true });
      expect(withoutInputs.can_finalize).toBe(false);
      expect(withoutInputs.should_block_closeout).toBe(true);
      expect(withoutInputs.blocking_reason_codes).toContain('input_refs_unavailable');

      const withInputs = finalizePrd(prdPath, [designInput], { checkOnly: true });
      expect(withInputs.blocking_reason_codes).not.toContain('input_refs_unavailable');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize blocks explicit outstanding-question blockers even with degraded preflight sweep', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'oq-blocker-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd()
        .replace('- preflight_sweep_closure: closed', '- preflight_sweep_closure: degraded')
        .replace('## Readiness Self-Check', [
          '## Outstanding Questions',
          '',
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '|---|---|---|---|---|---|---|---|',
          '| OQ-10 | Owner must choose fallback behavior | Requirements | yes |  | yes | unclosed | TBD |',
          '',
          '## Readiness Self-Check',
        ].join('\n')));

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.closeout_blocking_reason_codes).toEqual(expect.arrayContaining([
        'blocking_outstanding_question_present',
        'planning_invention_question_present',
        'unclosed_owner_question_present',
      ]));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize blocks PRD artifacts written under docs/prds', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'prds', 'illegal-ready-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd());

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.closeout_blocking_reason_codes).toContain('forbidden_prds_path');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize writes a machine-owned ready receipt when deterministic blockers are absent', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'ready-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd());

      const receipt = finalizePrd(prdPath, []);
      const finalized = fs.readFileSync(prdPath, 'utf8');
      const report = buildReport(prdPath, finalized);

      expect(receipt.can_finalize).toBe(true);
      expect(receipt.status).toBe('finalized');
      expect(finalized).toContain('status: ready-for-planning');
      expect(finalized).toContain('readiness_verified_by: check-prd-artifact.js');
      expect(finalized).toContain('readiness_checker_schema: spec-prd-artifact-check.v1');
      expect(report.facts.ready_receipt_present).toBe(true);
      expect(report.facts.ready_receipt_current).toBe(true);
      expect(report.facts.blocking_reason_codes).toEqual([]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // 004:checkpoint-closeout 拆分。合法 checkpoint 是 non-ready 但允许 closeout(exit 0);
  // 自称 ready 的 checkpoint 是矛盾,必须阻断。
  test('valid checkpoint can close out (can_finalize=false but should_block_closeout=false)', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'checkpoint-requirements.md');
    try {
      write(prdPath, `---
artifact_kind: prd-requirements
spec_id: cp-fixture
title: Checkpoint Fixture
date: 2026-06-25
status: draft
---

# Checkpoint Fixture

## Summary
未闭合的 checkpoint。

## Change Delta
extend。

## Requirements
| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | b | user-stated |

## Acceptance Examples
AE-01（对应 R-01）Given x When y Then z

## Scope Boundaries
### In Scope
### Out Of Scope

## Evidence And Assumptions
| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| c | user-stated | owner | n |

## Outstanding Questions
| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-2 | 中台持仓接口 | Requirements | yes |  | yes | unclosed | 待定 |

## Readiness Self-Check
- write_mode: checkpoint-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: no
- preflight_sweep_closure: blocked
`);
      const receipt = finalizePrd(prdPath, [], { checkOnly: true });
      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(false);
      expect(receipt.can_closeout).toBe(true);
      expect(receipt.status).toBe('checkpoint-closeout');
      // checkpoint check-only 不写 ready receipt
      expect(fs.readFileSync(prdPath, 'utf8')).not.toContain('readiness_verified_by');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // 232726 日志复现:input_scan_degraded 不应卡死合法 checkpoint。
  // input-side 核算信号只在 PRD 声称 ready 时才有意义;checkpoint 尚在 grill、允许 input 扫描降级。
  test('valid checkpoint with degraded source input can still close out', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'cp-degraded-input-requirements.md');
    const missingInput = path.join(tempDir, 'source_docs', 'missing.md');
    try {
      write(prdPath, validReadyIntentPrd()
        .replace('- write_mode: final-prd', '- write_mode: checkpoint-prd')
        .replace('- can_enter_spec_plan: yes', '- can_enter_spec_plan: no'));
      const receipt = finalizePrd(prdPath, [missingInput], { checkOnly: true });
      // input 解析失败 → blocking_reason_codes 含 input_scan_degraded
      expect(receipt.blocking_reason_codes).toContain('input_scan_degraded');
      // 合法 checkpoint 的 closeout 不受 input-side 信号影响
      expect(receipt.should_block_closeout).toBe(false);
      expect(receipt.can_closeout).toBe(true);
      expect(receipt.status).toBe('checkpoint-closeout');
      expect(receipt.closeout_blocking_reason_codes).not.toContain('input_scan_degraded');
      expect(receipt.closeout_blocking_reason_codes).not.toContain('input_refs_unavailable');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('checkpoint that claims ready is blocked (checkpoint_claims_ready)', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'cp-claims-ready-requirements.md');
    try {
      write(prdPath, validReadyIntentPrd('status: ready-for-planning\n').replace(
        '- write_mode: final-prd',
        '- write_mode: checkpoint-prd',
      ));
      const receipt = finalizePrd(prdPath, [], { checkOnly: true });
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.blocking_reason_codes).toContain('checkpoint_claims_ready');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// U7 (R20 / S5):checker BLOCKING freeze + characterization baseline。
// 这一组是确定性回归网,防 1064 行 checker 的 blocking 集合或 closure 形态静默漂移。
// freeze 写法:断言「当前真实输出」整集,任何增删都会 fail,强制 reviewer 显式确认。
// 这里的集合是 baseline(intended change 时同步更新并在 PR 做 diff review),不是不可变契约。
describe('spec-prd checker BLOCKING freeze + characterization (U7/R20)', () => {
  // 复用 closure-disposition razor 同款 ready-claiming PRD 骨架,只换 OQ/trace/design 段。
  function buildClosurePrd({ oq, trace, designCoverage, readinessExtra }) {
    return [
      '---',
      'spec_id: 2026-06-25-900-frz',
      'artifact_kind: prd-requirements',
      'status: ready-for-planning',
      '---',
      '',
      '## Summary',
      'Anchored brownfield increment.',
      '## Change Delta',
      '| item | current | target | delta | evidence |',
      '| --- | --- | --- | --- | --- |',
      '| x | a | b | extend | user-stated |',
      '## Requirements',
      '| id | priority | requirement | rationale/source |',
      '| --- | --- | --- | --- |',
      '| R-01 | P0 | Observable behavior | user-stated |',
      '## Acceptance Examples',
      'AE-01（对应 R-01）Given x When y Then z',
      '## Scope Boundaries',
      '### In Scope',
      '### Out Of Scope',
      '## Evidence And Assumptions',
      '| claim | tag | source / owner | note |',
      '| --- | --- | --- | --- |',
      '| c | user-stated | owner | n |',
      '## Outstanding Questions',
      ...oq,
      ...(trace || []),
      '## Readiness Self-Check',
      'write_mode: final-prd',
      'clarification_evidence: asked-owner',
      'can_enter_spec-plan: yes',
      'preflight_sweep_closure: closed',
      'decision_card_highest_risk_gap: test risk gap',
      'decision_card_next_action: final-prd',
      'decision_card_why_no_invention: plan will not invent WHAT',
      `design_source_coverage: ${designCoverage || 'not-needed'}`,
      ...(readinessExtra || []),
      '',
    ].join('\n');
  }

  const blockingSetOf = (prd) =>
    [...buildReport('docs/brainstorms/frz-requirements.md', prd).facts.blocking_reason_codes].sort();

  // freeze-1:BLOCKING_REASON_CODES 整集 freeze。
  // 守 KTD14 审计不变量——这张清单里不得出现任何 presence/ceremony reason_code
  // (intake_packet_absent / chunk_map_absent / grill_queue_absent / prewrite_grill_map_absent /
  //  source_type_extraction_absent / conflict_to_grill_mapping_absent / acceptance_example_mapping_absent /
  //  possible_misclassified_how_pushdown 等都必须留在 advisory,永不进 BLOCKING)。
  it('freezes the exact BLOCKING_REASON_CODES set (KTD14 audit invariant)', () => {
    const frozen = [
      'core_section_missing',
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
    ];
    expect([...BLOCKING_REASON_CODES].sort()).toEqual([...frozen].sort());

    // 守 KTD14:presence/ceremony advisory code 绝不出现在 BLOCKING 集合。
    const ceremonyAdvisory = [
      'intake_packet_absent',
      'source_authority_matrix_absent',
      'source_type_extraction_absent',
      'conflict_to_grill_mapping_absent',
      'prewrite_grill_map_absent',
      'chunk_map_absent',
      'risk_to_write_target_map_absent',
      'grill_queue_absent',
      'acceptance_example_mapping_absent',
      'possible_misclassified_how_pushdown',
    ];
    for (const code of ceremonyAdvisory) {
      expect(BLOCKING_REASON_CODES.has(code)).toBe(false);
    }
  });

  // freeze-facts:facts key-set 整集 freeze。下游 finalize/prewrite-guard/doc-review 按字段名读
  // facts(write_mode/ready_claim_present/blocking_reason_codes/design_source_refs_present 等),
  // 字段 rename 会静默翻转 hook exit code。本断言把 facts 完整 key 集冻结——任何增删字段都 fail,
  // 强制 reviewer 显式确认 + 同步下游消费方。与 BLOCKING freeze 同范式。
  it('freezes the exact facts key-set (downstream contract freeze)', () => {
    const prd = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-01 | q | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| OQ-01 | owner | a | Requirements | c | closed |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: [
        'design_source_inventory:',
        '- source_or_node: n',
        '  read_status: read',
        'design_sources_read:',
        '- x -> y -> z',
        'design_sources_unread:',
        '- none',
        'design_source_coverage: read',
      ],
    });
    const factsKeys = Object.keys(buildReport('docs/brainstorms/frz-facts-requirements.md', prd).facts).sort();
    const frozenKeys = [
      'acceptance_ids',
      'artifact_kind',
      'assumption_row_count',
      'blocking_finding_count',
      'blocking_outstanding_question_count',
      'blocking_reason_codes',
      'can_enter_spec_plan',
      'can_enter_spec_plan_declared_valid',
      'clarification_evidence',
      'clarification_evidence_declared_valid',
      'clarification_trace_present',
      'core_sections_missing',
      'core_sections_present',
      'decision_card_highest_risk_gap_present',
      'decision_card_next_action',
      'decision_card_present',
      'decision_card_why_no_invention_present',
      'design_coverage_partial',
      'design_degraded_owner_accepted',
      'design_source_coverage_declared',
      'design_source_inventory_declared',
      'design_source_refs_present',
      'design_sources_read_present',
      'design_sources_unread_non_empty',
      'design_sources_unread_present',
      'evidence_tags_present',
      'feature_slice_trace_gap_count',
      'frontmatter_present',
      'how_pushdown_touches_what_count',
      'input_design_refs_present',
      'input_refs_used',
      'input_scan_attempted',
      'input_scan_degraded',
      'nfr_count',
      'nfr_ids',
      'open_oq_without_owner_closure_count',
      'outstanding_question_closure_contract_present',
      'outstanding_question_count',
      'outstanding_question_missing_closure_count',
      'outstanding_question_rows',
      'outstanding_questions_count',
      'outstanding_questions_present',
      'owner_decision_trace_present',
      'placeholder_line_count',
      'planning_invention_question_count',
      'planning_recheck_count',
      'planning_recheck_present',
      'possible_misclassified_how_pushdown_count',
      'preflight_sweep_closure',
      'preflight_sweep_closure_declared_valid',
      'priority_distribution',
      'ready_claim_present',
      'ready_receipt_current',
      'ready_receipt_inputs_hash',
      'ready_receipt_prd_hash',
      'ready_receipt_present',
      'requirement_ids',
      'unclosed_owner_question_count',
      'uncovered_requirements',
      'write_mode',
      'write_mode_declared_valid',
    ];
    expect(factsKeys).toEqual(frozenKeys);
  });

  // freeze-2:代表性 closure 形态的 blocking 整集 characterization。
  // .toContain 只证「某 code 在」,这里证「整集恰好是这些」——多报/少报未被单测断言的 code 都会 fail。
  it('characterizes the 19:07 self-downgrade shape blocking set', () => {
    const shape1907 = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-2 | 中台持仓接口是否可用 | Requirements | no |  | no | closed | 本期降级隐藏 |',
      ],
    });
    expect(blockingSetOf(shape1907)).toEqual([
      'open_oq_without_owner_closure',
      'owner_decision_trace_required_but_absent',
      'preflight_closure_contradicted',
      'ready_receipt_absent',
    ]);
  });

  it('characterizes the how-pushdown backdoor shape blocking set', () => {
    const pushdown = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-4 | 行情权限 availability 如何取 | Requirements | no | implementation-only-how-pushdown | no | closed | 实现期定 |',
      ],
    });
    expect(blockingSetOf(pushdown)).toEqual([
      'how_pushdown_touches_what',
      'owner_decision_trace_required_but_absent',
      'preflight_closure_contradicted',
      'ready_receipt_absent',
    ]);
  });

  it('characterizes the design partial/unread-without-acceptance shape blocking set', () => {
    const designBad = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读'],
    });
    expect(blockingSetOf(designBad)).toEqual([
      'design_partial_coverage_unaccepted',
      'design_source_inventory_undeclared',
      'design_sources_read_undeclared',
      'design_unread_without_owner_acceptance',
      'owner_decision_trace_required_but_absent',
      'preflight_closure_contradicted',
      'ready_receipt_absent',
    ]);
  });

  it('does not treat naked design degraded owner acceptance as verified evidence', () => {
    const nakedAcceptance = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读', 'design_degraded_owner_acceptance: true'],
    });
    const nakedReport = buildReport('docs/brainstorms/design-acceptance-requirements.md', nakedAcceptance);
    expect(nakedReport.facts.design_degraded_owner_accepted).toBe(false);
    expect(nakedReport.facts.blocking_reason_codes).toEqual(expect.arrayContaining([
      'design_partial_coverage_unaccepted',
      'design_unread_without_owner_acceptance',
    ]));

    const referencedAcceptance = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读', 'design_degraded_owner_acceptance: true #D-1'],
    });
    const referencedReport = buildReport('docs/brainstorms/design-acceptance-requirements.md', referencedAcceptance);
    expect(referencedReport.facts.design_degraded_owner_accepted).toBe(true);
    expect(referencedReport.facts.blocking_reason_codes).not.toContain('design_partial_coverage_unaccepted');
    expect(referencedReport.facts.blocking_reason_codes).not.toContain('design_unread_without_owner_acceptance');

    const distantRefAcceptance = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: [
        'design_degraded_owner_acceptance_ref: #D-1',
        'unrelated_field: keep',
        'another_unrelated_field: keep',
        'design_sources_unread:',
        '- node-123 未读',
        'design_degraded_owner_acceptance: true',
      ],
    });
    expect(buildReport('docs/brainstorms/design-acceptance-requirements.md', distantRefAcceptance)
      .facts.design_degraded_owner_accepted).toBe(false);

    const blockingOwnerTrace = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| decision | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| D-1 design unread | owner | 必须先读 Figma | Design Source Coverage | 未满足则不能 ready | open |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读'],
    });
    expect(buildReport('docs/brainstorms/design-acceptance-requirements.md', blockingOwnerTrace)
      .facts.design_degraded_owner_accepted).toBe(false);

    const openAcceptedOwnerTrace = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| decision | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| D-1 design degraded | owner accepted | 同意降级使用文字稿 | Design Source Coverage | design risk accepted | open |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读'],
    });
    expect(buildReport('docs/brainstorms/design-acceptance-requirements.md', openAcceptedOwnerTrace)
      .facts.design_degraded_owner_accepted).toBe(false);

    const acceptedOwnerTrace = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| decision | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| D-1 design degraded | owner accepted | 同意降级使用文字稿 | Design Source Coverage | design risk accepted | closed |',
      ],
      designCoverage: 'visual-read=partial',
      readinessExtra: ['design_sources_unread:', '- node-123 未读'],
    });
    expect(buildReport('docs/brainstorms/design-acceptance-requirements.md', acceptedOwnerTrace)
      .facts.design_degraded_owner_accepted).toBe(true);
  });

  // F-L1 characterization:21:16 KAZ 形态——多条 owner-* OQ,但 Owner Decision Trace
  // 只有一条不点名这些 OQ 的全局行。逐行绑定前全部放行(全局开关);绑定后每条 fire
  // open_oq_without_owner_closure。证明 L1 全局放行洞已堵,且复用既有 code(不碰 30-set)。
  it('characterizes the 21:16 unbound owner-capped shape (F-L1 per-row binding)', () => {
    const unbound = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-2 | 中台持仓接口契约未给出 | R-05 | no | owner-capped | no | open | 规划并行 |',
        '| OQ-4 | 时段判定数据来源 | R-12 | no | owner-capped | no | open | 接口确认 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| 交付范围如何界定 | owner | 仅 App 端 | Producer 边界 | 不展开后台 | closed |',
      ],
    });
    const report = buildReport('docs/brainstorms/frz-requirements.md', unbound);
    expect(report.facts.blocking_reason_codes).toContain('open_oq_without_owner_closure');
    expect(report.facts.open_oq_without_owner_closure_count).toBe(2);
  });

  // F-L1 反向:合法绑定不被误杀。owner-* OQ 各有一条 verbatim-question 或 id-reference
  // 绑定的 trace 行 → 不 fire open_oq_without_owner_closure。守「不向诚实作者收 ceremony 税」。
  it('does not fire open_oq_without_owner_closure when each owner-* OQ binds a trace row (F-L1)', () => {
    const bound = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-2 | 中台持仓接口是否可用 | Requirements | no | owner-answered | no | closed | 本期降级隐藏 |',
        '| OQ-3 | 范围如何界定 | Scope Boundaries | no | owner-capped | no | closed | 仅 App 端 |',
      ],
      trace: [
        '## Owner Decision Trace',
        '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
        '| --- | --- | --- | --- | --- | --- |',
        '| 中台持仓接口是否可用 | owner | 本期降级隐藏 | Requirements | AE 覆盖隐藏态 | closed |',
        '| OQ-3 范围 | owner | 仅 App 端 | Scope Boundaries | 后台另起 surface | closed |',
      ],
    });
    const report = buildReport('docs/brainstorms/frz-requirements.md', bound);
    expect(report.facts.blocking_reason_codes).not.toContain('open_oq_without_owner_closure');
    expect(report.facts.open_oq_without_owner_closure_count).toBe(0);
  });

  // 合法 checkpoint:带 residue 但非 claims-ready,任何 ready blocker 都不得触发(空集)。
  it('characterizes the valid checkpoint shape as carrying zero blocking codes', () => {
    const checkpoint = [
      '---',
      'spec_id: 2026-06-25-901-cp',
      'artifact_kind: prd-requirements',
      'status: draft',
      '---',
      '',
      '## Summary',
      'x',
      '## Change Delta',
      '| item | current | target | delta | evidence |',
      '| --- | --- | --- | --- | --- |',
      '| x | a | b | extend | user-stated |',
      '## Requirements',
      '| id | priority | requirement | rationale/source |',
      '| --- | --- | --- | --- |',
      '| R-01 | P0 | b | user-stated |',
      '## Acceptance Examples',
      'AE-01（对应 R-01）Given x When y Then z',
      '## Scope Boundaries',
      '### In Scope',
      '### Out Of Scope',
      '## Evidence And Assumptions',
      '| claim | tag | source / owner | note |',
      '| --- | --- | --- | --- |',
      '| c | user-stated | owner | n |',
      '## Outstanding Questions',
      '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |',
      '| OQ-2 | 中台持仓接口 | Requirements | yes |  | yes | unclosed | 待定 |',
      '## Readiness Self-Check',
      'write_mode: checkpoint-prd',
      'clarification_evidence: asked-owner',
      'can_enter_spec-plan: no',
      'preflight_sweep_closure: blocked',
      'design_source_coverage: not-needed',
      '',
    ].join('\n');
    expect(blockingSetOf(checkpoint)).toEqual([]);
  });

  // freeze-3:preflight_closure_contradicted 直接断言。
  // 它是 30 个 blocking code 里此前 golden 无直接覆盖的一个(contracts/finalize 双零)。
  // 形态:preflight_sweep_closure=closed 与一个仍在的 closure blocker(open OQ)矛盾。
  it('directly asserts preflight_closure_contradicted on a closed-sweep-with-residue shape', () => {
    const contradicted = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-2 | 中台持仓接口是否可用 | Requirements | no |  | no | closed | 本期降级隐藏 |',
      ],
    });
    const report = buildReport('docs/brainstorms/frz-requirements.md', contradicted);
    expect(report.facts.blocking_reason_codes).toContain('preflight_closure_contradicted');
  });

  // #14:inputs 数量超 MAX_INPUT_COUNT(32) emit advisory input_scan_input_count_capped(非 BLOCKING,守 KTD14)。
  it('emits input_scan_input_count_capped advisory when --inputs exceeds MAX_INPUT_COUNT', () => {
    const inputs = Array.from({ length: 33 }, (_, i) => `docs/x${i}.md`);
    const prd = buildClosurePrd({
      oq: [
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-01 | q | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
      ],
      designCoverage: 'not-needed',
    });
    const report = buildReport('docs/brainstorms/frz-input-count-requirements.md', prd, { inputs });
    const advisory = report.findings.find((f) => f.reason_code === 'input_scan_input_count_capped');
    expect(advisory).toBeDefined();
    expect(advisory.count).toBe(33);
    expect(advisory.limit).toBe(32);
    // 守 KTD14:advisory 不进 BLOCKING 集合,不翻转 should_block_closeout。
    expect(report.facts.blocking_reason_codes).not.toContain('input_scan_input_count_capped');
  });

  // --refresh-inputs-hash: 当 inputs 文件被修改后 ready_receipt_stale 死锁时，允许只刷新 inputs hash。
  test('--refresh-inputs-hash allows re-finalizing when only ready_receipt_stale blocks', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'stale-inputs-requirements.md');
    const inputPath = path.join(tempDir, 'source_docs', 'plan.md');
    try {
      write(inputPath, 'original content\n');
      write(prdPath, validReadyIntentPrd());

      // 首次 finalize，写入 receipt
      const first = finalizePrd(prdPath, [inputPath]);
      expect(first.can_finalize).toBe(true);
      expect(first.status).toBe('finalized');

      // 修改 inputs 文件 → ready_receipt_stale
      write(inputPath, 'modified content\n');
      const stale = finalizePrd(prdPath, [inputPath], { checkOnly: true });
      expect(stale.blocking_reason_codes).toContain('ready_receipt_stale');
      expect(stale.can_finalize).toBe(false);

      // --refresh-inputs-hash 打破死锁
      const refreshed = finalizePrd(prdPath, [inputPath], { refreshInputsHash: true });
      expect(refreshed.can_finalize).toBe(true);
      expect(refreshed.status).toBe('finalized');
      expect(refreshed.blocking_reason_codes).toContain('ready_receipt_stale'); // 仍报告，但不阻断
      expect(refreshed.closeout_blocking_reason_codes).not.toContain('ready_receipt_stale');
      expect(refreshed.should_block_closeout).toBe(false);

      // 刷新后 check-only 应通过
      const after = finalizePrd(prdPath, [inputPath], { checkOnly: true });
      expect(after.can_finalize).toBe(true);
      expect(after.blocking_reason_codes).not.toContain('ready_receipt_stale');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('--refresh-inputs-hash CLI exits 0 after refreshing stale inputs receipt', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'stale-inputs-cli-requirements.md');
    const inputPath = path.join(tempDir, 'source_docs', 'plan.md');
    try {
      write(inputPath, 'original content\n');
      write(prdPath, validReadyIntentPrd());
      expect(finalizePrd(prdPath, [inputPath]).status).toBe('finalized');

      write(inputPath, 'modified content\n');
      const result = spawnSync(process.execPath, [
        FINALIZE_SCRIPT,
        prdPath,
        '--inputs',
        inputPath,
        '--refresh-inputs-hash',
      ], { encoding: 'utf8' });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      const receipt = JSON.parse(result.stdout);
      expect(receipt.status).toBe('finalized');
      expect(receipt.wrote_ready_receipt).toBe(true);
      expect(receipt.blocking_reason_codes).toContain('ready_receipt_stale');
      expect(receipt.closeout_blocking_reason_codes).not.toContain('ready_receipt_stale');
      expect(receipt.should_block_closeout).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // P1-2 回归:散文字符串形式的 design_sources_read 不应视为已声明
  test('design_sources_read with prose value (not list) reports design_sources_read_undeclared', () => {
    const prd = `---
artifact_kind: prd-requirements
spec_id: design-read-prose-fixture
source_inputs:
  - docs/design-input.md
design_sources_unread:
  - figma://abc node 1:2
design_sources_unread_reason: not read
design_sources_read: Figma 画布未直接读取（画布需规划前获取），设计稿链接已记录
---

# Design Read Prose Fixture

##    Résumé

Test.

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |

## Acceptance Examples

| id | covers | example |
| --- | --- | --- |

## Scope Boundaries

In scope: test.

## Evidence And Assumptions

| type | item | evidence |
| --- | --- | --- |

## Readiness Self-Check

- write_mode: final-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: yes
- preflight_sweep_closure: closed
- decision_card_highest_risk_gap: owner 确认持仓接口口径
- decision_card_next_action: final-prd
- decision_card_why_no_invention: 三个 load-bearing OQ 已 owner 闭合,plan 无需发明 WHAT
`;
    const report = buildReport('docs/brainstorms/design-read-prose-requirements.md', prd);
    expect(report.facts.design_sources_read_present).toBe(false);
    expect(report.facts.blocking_reason_codes).toContain('design_sources_read_undeclared');
  });

  test('--refresh-inputs-hash does NOT allow finalizing when other blocking codes exist', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'stale-blocked-requirements.md');
    const inputPath = path.join(tempDir, 'source_docs', 'plan.md');
    try {
      write(inputPath, 'content\n');
      // PRD 有结构问题(缺 preflight_sweep_closure)
      const brokenPrd = validReadyIntentPrd()
        .replace('- preflight_sweep_closure: closed', '- preflight_sweep_closure: blocked');
      write(prdPath, brokenPrd);

      const receipt = finalizePrd(prdPath, [inputPath], { refreshInputsHash: true });
      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

// A: check-prd-artifact.js --stdin 写前 dry-run lint
// 模型在正式 Write 前先 pipe draft 拿全部 findings,消除"写→Stop hook 拦→修一个→再拦"循环。
describe('check-prd-artifact --stdin dry-run', () => {
  const CHECK_SCRIPT = path.join(__dirname, '..', '..', 'skills', 'spec-prd', 'scripts', 'check-prd-artifact.js');

  test('--stdin reads PRD content from stdin and emits all findings at once', () => {
    const badPrd = `---
artifact_kind: prd-requirements
spec_id: stdin-fixture
---

# Bad

## Summary

缺核心 section 和 readiness 声明。
`;
    const result = spawnSync(process.execPath, [CHECK_SCRIPT, 'docs/brainstorms/stdin-fixture-requirements.md', '--stdin'], {
      input: badPrd,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const report = JSON.parse(result.stdout);
    // 一次性暴露全部 blocking codes(写前就能看到,而非被 Stop hook 一个一个拦)
    expect(report.facts.blocking_reason_codes).toEqual(expect.arrayContaining([
      'core_section_missing',
      'write_mode_undeclared',
      'can_enter_spec_plan_undeclared',
      'clarification_evidence_undeclared',
      'preflight_sweep_closure_absent',
    ]));
    expect(report.findings.length).toBeGreaterThan(5);
  });

  test('--stdin on a compliant draft reports zero blocking codes', () => {
    const goodPrd = `---
artifact_kind: prd-requirements
spec_id: stdin-good
status: draft
write_mode: checkpoint-prd
can_enter_spec_plan: no
clarification_evidence: source-proven-no-ask
preflight_sweep_closure: closed
source_inputs:
  - docs/input.md
---

# Good

## Summary

合规 draft。

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | test | source |

## Acceptance Examples

| id | covers | example |
| --- | --- | --- |
| AE-01 | R-01 | test |

## Scope Boundaries

In scope: test.

## Evidence And Assumptions

| type | item | evidence |
| --- | --- | --- |
| confirmed-source | test | source |
`;
    const result = spawnSync(process.execPath, [CHECK_SCRIPT, 'docs/brainstorms/stdin-good-requirements.md', '--stdin'], {
      input: goodPrd,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.facts.blocking_reason_codes).toEqual([]);
  });
});

// Decision Card 三要素 artifact 验证:Phase 1 中间产物从对话外化为可验证字段。
describe('check-prd-artifact decision_card verification', () => {
  const baseFinalPrd = `---
artifact_kind: prd-requirements
spec_id: dc-fixture
status: ready-for-planning
source_inputs:
  - docs/input.md
---

# DC Fixture

## Summary

x

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | t | s |

## Acceptance Examples

| id | covers | example |
| --- | --- | --- |
| AE-01 | R-01 | t |

## Scope Boundaries

In scope: t.

## Evidence And Assumptions

| type | item | evidence |
| --- | --- | --- |
| confirmed-source | t | s |

## Readiness Self-Check

- write_mode: final-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: yes
- preflight_sweep_closure: closed`;

  test('final-prd missing all decision_card fields → decision_card_undeclared', () => {
    const report = buildReport('docs/brainstorms/dc-missing-requirements.md', baseFinalPrd);
    expect(report.facts.blocking_reason_codes).toContain('decision_card_undeclared');
    expect(report.facts.decision_card_present).toBe(false);
  });

  test('final-prd with all three decision_card fields passes', () => {
    const good = baseFinalPrd + '\n- decision_card_highest_risk_gap: owner 接口口径\n- decision_card_next_action: final-prd\n- decision_card_why_no_invention: OQ 已闭合';
    const report = buildReport('docs/brainstorms/dc-good-requirements.md', good);
    expect(report.facts.decision_card_present).toBe(true);
    expect(report.facts.blocking_reason_codes).not.toContain('decision_card_undeclared');
  });

  test('final-prd with partial decision_card fields still fails', () => {
    const partial = baseFinalPrd + '\n- decision_card_highest_risk_gap: gap only';
    const report = buildReport('docs/brainstorms/dc-partial-requirements.md', partial);
    expect(report.facts.decision_card_present).toBe(false);
    expect(report.facts.blocking_reason_codes).toContain('decision_card_undeclared');
  });

  test('checkpoint-prd does NOT require decision_card (still grilling)', () => {
    const checkpoint = baseFinalPrd
      .replace('status: ready-for-planning', 'status: checkpoint')
      .replace('- write_mode: final-prd', '- write_mode: checkpoint-prd')
      .replace('- can_enter_spec_plan: yes', '- can_enter_spec_plan: no');
    const report = buildReport('docs/brainstorms/dc-checkpoint-requirements.md', checkpoint);
    expect(report.facts.blocking_reason_codes).not.toContain('decision_card_undeclared');
  });
});
