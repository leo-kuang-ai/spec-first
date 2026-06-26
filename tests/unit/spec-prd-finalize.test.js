'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildReport,
  BLOCKING_REASON_CODES,
} = require('../../skills/spec-prd/scripts/check-prd-artifact');
const { finalizePrd } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');

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
});
