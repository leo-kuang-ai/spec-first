'use strict';

// P1/P2: checker 纯函数 in-process 单测。
// P1: 基础纯函数(looksLikeCheckableRef/traceRowBindsOq/isEmptyish/matchHeadingTitle/parseHeaderedTable)
// P2: 三阶段函数 gateReadyClaims — 无需整份 PRD fixture,直接传构造 facts 对象即可断言

const {
  buildReport,
  parseStructure,
  gateReadyClaims,
  looksLikeCheckableRef,
  traceRowBindsOq,
  isEmptyish,
  matchHeadingTitle,
  stripHeadingDecoration,
  parseHeaderedTable,
  OQ_HEADER_ALIASES,
  TRACE_HEADER_ALIASES,
  WHAT_TOUCHING_KEYWORDS,
} = require('../../skills/spec-prd/scripts/check-prd-artifact');

function sectionIdChineseReadyPrd(overrides = {}) {
  const readiness = overrides.readiness || [
    '- write_mode: final-prd',
    '- clarification_evidence: asked-owner',
    '- can_enter_spec_plan: yes',
    '- preflight_sweep_closure: closed',
    '- decision_card_highest_risk_gap: owner confirmed fallback',
    '- decision_card_next_action: final-prd',
    '- decision_card_why_no_invention: OQ-01 is closed by owner trace',
  ];
  return [
    '---',
    'artifact_kind: prd-requirements',
    'spec_id: section-id-fixture',
    'title: Section ID Fixture',
    'date: 2026-06-30',
    ...(overrides.frontmatter || []),
    '---',
    '',
    '# Section ID Fixture',
    '',
    '<!-- prd:section=summary -->',
    '## 需求概述',
    '纯中文标题,依靠 section id 提供机器 identity。',
    '',
    '<!-- prd:section=change_delta -->',
    '## 变更差异',
    '| item | current | target | delta | evidence |',
    '| --- | --- | --- | --- | --- |',
    '| x | old | new | extend | user-stated |',
    '',
    '<!-- prd:section=requirements -->',
    '## 需求列表',
    '| ID | Priority | Requirement | Source |',
    '| --- | --- | --- | --- |',
    '| R-01 | P0 | 展示 fallback 状态 | user-stated |',
    '',
    '<!-- prd:section=acceptance_examples -->',
    '## 验收样例',
    '| ID | Covers | Example |',
    '| --- | --- | --- |',
    '| AE-01 | R-01 | Given fallback When page opens Then show fallback copy |',
    '',
    '<!-- prd:section=scope_boundaries -->',
    '## 范围边界',
    'In scope: fallback copy.',
    '',
    '<!-- prd:section=evidence_assumptions -->',
    '## 证据与假设',
    '| Type | Item | Evidence |',
    '| --- | --- | --- |',
    '| assumption | fallback copy | owner |',
    '',
    '<!-- prd:section=outstanding_questions -->',
    '## 未决问题',
    '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    '| OQ-01 | fallback copy source | Requirements | no | owner-answered | no | closed | OQ-01 owner trace |',
    '',
    '<!-- prd:section=owner_decision_trace -->',
    '## Owner 决策追踪',
    '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
    '| --- | --- | --- | --- | --- | --- |',
    '| fallback copy source | owner | use owner copy | Requirements | R-01 copy fixed | closed |',
    ...(overrides.ownerTraceRows || []),
    '',
    ...(overrides.extraSections || []),
    '<!-- prd:section=readiness_self_check -->',
    '## 就绪自检',
    ...readiness,
    '',
  ].join('\n');
}

describe('looksLikeCheckableRef', () => {
  test('URL 形似可核查引用', () => {
    expect(looksLikeCheckableRef('https://figma.com/file/123')).toBe(true);
    expect(looksLikeCheckableRef('see http://example.com/a for detail')).toBe(true);
  });

  test('文件路径带扩展名形似引用', () => {
    expect(looksLikeCheckableRef('src/cli/foo.js')).toBe(true);
    expect(looksLikeCheckableRef('docs/contracts/bar.md:42')).toBe(true);
  });

  test('锚点 id 形似引用', () => {
    expect(looksLikeCheckableRef('#owner-decision')).toBe(true);
  });

  test('多段路径(>=2 斜杠)形似引用', () => {
    expect(looksLikeCheckableRef('src/cli/contracts/foo')).toBe(true);
  });

  test('散文里的 and/or / input/output 不算 ref(单斜杠词)', () => {
    // 这是 source-ref-shape fix 想堵的廉价伪造:散文里的 and/or 被误判为 ref
    expect(looksLikeCheckableRef('and/or')).toBe(false);
    expect(looksLikeCheckableRef('input/output')).toBe(false);
  });

  test('n/a 不算 ref', () => {
    expect(looksLikeCheckableRef('n/a')).toBe(false);
    expect(looksLikeCheckableRef('')).toBe(false);
    expect(looksLikeCheckableRef(null)).toBe(false);
  });
});

describe('traceRowBindsOq', () => {
  test('question-match:normalize 后 exact 相等则绑定', () => {
    const traceRow = { question: 'What is the auth scope?', chosen_answer: 'x', prd_write_target: 'y', consequence: 'z' };
    const oqRow = { question: 'what IS the AUTH scope?', id: 'OQ-1' };
    expect(traceRowBindsOq(traceRow, oqRow)).toBe(true);
  });

  test('id-reference:OQ id 作为 bounded token 出现在 trace 可识别 cell 则绑定', () => {
    const traceRow = {
      question: 'permission boundary',
      chosen_answer: 'decided per OQ-2',
      prd_write_target: 'R-01 permission',
      consequence: 'must gate at edge',
    };
    const oqRow = { question: 'unrelated question text', id: 'OQ-2' };
    expect(traceRowBindsOq(traceRow, oqRow)).toBe(true);
  });

  test('OQ-2 不被 OQ-20 越界配对(防 OQ-2 误配 OQ-20)', () => {
    // tokenRegex 用 (?![0-9]) 边界,OQ-20 里的 OQ-2 不应被 OQ-2 命中
    const traceRow = {
      question: 'x',
      chosen_answer: 'see OQ-20 for the real decision',
      prd_write_target: 'R-01',
      consequence: 'z',
    };
    const oqRow = { question: 'unrelated', id: 'OQ-2' };
    expect(traceRowBindsOq(traceRow, oqRow)).toBe(false);
  });

  test('空 OQ id 且 question 不匹配则不绑定', () => {
    const traceRow = { question: 'A?', chosen_answer: 'a', prd_write_target: 'b', consequence: 'c' };
    const oqRow = { question: 'B?', id: '' };
    expect(traceRowBindsOq(traceRow, oqRow)).toBe(false);
  });
});

describe('isEmptyish', () => {
  test('空值归一:none/无/空/n-a/占位/[]/-', () => {
    ['', 'none', 'no', '无', '空', 'n/a', 'na', 'not-needed', 'not applicable', '[]', '-', '<placeholder>']
      .forEach((v) => expect(isEmptyish(v)).toBe(true));
  });

  test('实质内容非空', () => {
    ['read Figma node 12', 'owner-answered', 'src/cli/foo.js']
      .forEach((v) => expect(isEmptyish(v)).toBe(false));
  });
});

describe('matchHeadingTitle / stripHeadingDecoration', () => {
  test('精确相等命中', () => {
    expect(matchHeadingTitle('Summary', 'Summary')).toBe(true);
  });

  test('去装饰后命中:序号/标点前导', () => {
    expect(matchHeadingTitle('一、Summary 概要', 'Summary')).toBe(true);
    expect(matchHeadingTitle('(1) Summary', 'Summary')).toBe(true);
    expect(matchHeadingTitle('1. Summary', 'Summary')).toBe(true);
  });

  test('英文锚点 + 中文 gloss 命中,锚点后是非字母数字边界', () => {
    expect(matchHeadingTitle('Summary（文档概要）', 'Summary')).toBe(true);
    expect(matchHeadingTitle('## Summary 概要', 'Summary')).toBe(true);
  });

  test('Non-Functional Requirements 不被误判为 Requirements(前缀后是字母)', () => {
    expect(matchHeadingTitle('Non-Functional Requirements', 'Requirements')).toBe(false);
  });

  test('stripHeadingDecoration 剥离序号装饰', () => {
    expect(stripHeadingDecoration('一、需求概要')).toBe('需求概要');
    expect(stripHeadingDecoration('## Summary')).toBe('Summary');
  });
});

describe('section id identity and localized PRD facts', () => {
  test('section-id lets pure Chinese headings satisfy core sections and derived facts', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-requirements.md',
      sectionIdChineseReadyPrd(),
    );

    expect(report.facts.core_sections_missing).toEqual([]);
    expect(report.facts.core_sections_present).toEqual([
      'Summary',
      'Change Delta',
      'Requirements',
      'Acceptance Examples',
      'Scope Boundaries',
      'Evidence And Assumptions',
    ]);
    expect(report.facts.uncovered_requirements).toEqual([]);
    expect(report.facts.assumption_row_count).toBe(1);
    expect(report.facts.priority_distribution).toEqual({ P0: 1 });
    expect(report.facts.outstanding_questions_present).toBe(true);
    expect(report.facts.outstanding_questions_count).toBe(1);
    expect(report.facts.owner_decision_trace_present).toBe(true);
    expect(report.facts.open_oq_without_owner_closure_count).toBe(0);
    expect(report.facts.blocking_reason_codes).not.toContain('core_section_missing');
    expect(report.facts.blocking_reason_codes).not.toContain('machine_section_identity_missing');
  });

  test('section-id comments are machine anchors, not placeholder findings', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-comments-requirements.md',
      sectionIdChineseReadyPrd(),
    );

    expect(report.findings.map((finding) => finding.reason_code))
      .not.toContain('placeholder_or_todo_present');
    expect(report.facts.placeholder_line_count).toBe(0);
  });

  test('parseStructure prdShaped uses section-id rather than English heading tokens only', () => {
    const structure = parseStructure(
      'docs/brainstorms/section-id-requirements.md',
      sectionIdChineseReadyPrd(),
    );

    expect(structure.missingCoreSections).toEqual([]);
    expect(structure.uncoveredRequirements).toEqual([]);
    expect(structure.prdShaped).toBe(true);
  });

  test('localized requirements-shaped drafts still trigger readiness evasion blockers', () => {
    const report = buildReport(
      'docs/brainstorms/localized-draft-requirements.md',
      [
        '---',
        'title: Localized Draft',
        '---',
        '',
        '# Localized Draft',
        '',
        '## 需求列表',
        '| ID | Priority | Requirement |',
        '| --- | --- | --- |',
        '| R-01 | P0 | 展示 fallback 状态 |',
        '',
        '## 验收样例',
        '| ID | Covers | Example |',
        '| --- | --- | --- |',
        '| AE-01 | R-01 | Given fallback When page opens Then show fallback copy |',
      ].join('\n'),
    );

    expect(report.facts.core_sections_missing).toEqual([
      'Summary',
      'Change Delta',
      'Requirements',
      'Acceptance Examples',
      'Scope Boundaries',
      'Evidence And Assumptions',
    ]);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason_code: 'prd_readiness_declarations_evaded' }),
      expect.objectContaining({ reason_code: 'preflight_sweep_closure_absent' }),
    ]));
    expect(report.facts.blocking_reason_codes).toEqual(expect.arrayContaining([
      'prd_readiness_declarations_evaded',
      'preflight_sweep_closure_absent',
    ]));
    expect(report.facts.blocking_reason_codes).not.toContain('core_section_missing');
  });

  test('section-id drives planning recheck and feature slice derived facts', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-derived-facts-requirements.md',
      sectionIdChineseReadyPrd({
        extraSections: [
          '<!-- prd:section=planning_recheck -->',
          '## 规划复核',
          '| item | why recheck | required before | blocks planning? |',
          '| --- | --- | --- | --- |',
          '| source refresh | confirm current route | planning | no |',
          '',
          '<!-- prd:section=feature_slices -->',
          '## 功能切片',
          'feature_id: FS-01',
          'title: fallback copy',
          'requirement_refs: R-01',
          '',
        ],
      }),
    );

    expect(report.facts.planning_recheck_present).toBe(true);
    expect(report.facts.planning_recheck_count).toBe(1);
    expect(report.facts.feature_slice_trace_gap_count).toBe(1);
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason_code: 'feature_slice_missing_acceptance_trace' }),
    ]));
  });

  test('owner trace design-degraded acceptance uses section-id on pure Chinese heading', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-design-accepted-requirements.md',
      sectionIdChineseReadyPrd({
        ownerTraceRows: [
          '| accept degraded Figma read for OQ-02 | owner accepted unread Figma https://figma.com/file/abc | accepted degraded design coverage | Design Source Coverage | OQ-02 accepted degraded design risk | closed |',
        ],
        extraSections: [
          '<!-- prd:section=design_source_coverage -->',
          '## 设计源覆盖',
          'design_source_inventory:',
          '- source_or_node: https://figma.com/file/abc',
          '  read_status: unread',
          '  PRD write target: Acceptance Examples',
          '  evidence_level: provider_untrusted',
          '  unread_reason: tool unavailable',
          '  readiness consequence: owner accepted degraded risk in OQ-02',
          'design_sources_read:',
          '- none',
          'design_sources_unread:',
          '- https://figma.com/file/abc unread because tool unavailable',
          'design_source_coverage: partial',
          '',
        ],
      }),
    );

    expect(report.facts.design_source_refs_present).toBe(true);
    expect(report.facts.design_degraded_owner_accepted).toBe(true);
    expect(report.facts.blocking_reason_codes).not.toContain('design_partial_coverage_unaccepted');
    expect(report.facts.blocking_reason_codes).not.toContain('machine_section_identity_missing');
  });

  test('localized section-id OQ table still emits blocking OQ reason codes', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-oq-blockers-requirements.md',
      sectionIdChineseReadyPrd({
        readiness: [
          '- write_mode: final-prd',
          '- clarification_evidence: asked-owner',
          '- can_enter_spec_plan: yes',
          '- preflight_sweep_closure: degraded',
          '- decision_card_highest_risk_gap: unresolved fallback behavior',
          '- decision_card_next_action: final-prd',
          '- decision_card_why_no_invention: OQ-01 remains open',
        ],
      }).replace(
        '| OQ-01 | fallback copy source | Requirements | no | owner-answered | no | closed | OQ-01 owner trace |',
        '| OQ-01 | fallback copy source | Requirements | yes |  | yes | unclosed | TBD |',
      ),
    );

    expect(report.facts.blocking_reason_codes).toEqual(expect.arrayContaining([
      'blocking_outstanding_question_present',
      'planning_invention_question_present',
      'unclosed_owner_question_present',
    ]));
  });

  test('design source refs require design_source_coverage section identity on final-ready path', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-design-missing-identity-requirements.md',
      sectionIdChineseReadyPrd({
        extraSections: [
          'Design source: https://figma.com/file/abc',
          '',
        ],
      }),
    );

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'design_source_coverage',
      }),
    ]));
    expect(report.facts.blocking_reason_codes).toContain('machine_section_identity_missing');
  });

  test('orphan, unknown, and duplicate non-machine section ids are advisory findings', () => {
    const report = buildReport(
      'docs/brainstorms/section-id-advisory-requirements.md',
      [
        sectionIdChineseReadyPrd(),
        '',
        '<!-- prd:section=summary -->',
        '## 另一个概要',
        'duplicate summary id',
        '',
        '<!-- prd:section=unknown_section -->',
        '## 未知区块',
        'unknown id',
        '',
        '<!-- prd:section=source_inputs -->',
        'orphan because the next nonblank line is not a heading',
      ].join('\n'),
    );

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason_code: 'section_id_duplicate', section: 'summary' }),
      expect.objectContaining({ reason_code: 'section_id_unknown', section_id: 'unknown_section' }),
      expect.objectContaining({ reason_code: 'section_id_orphaned', section: 'source_inputs' }),
    ]));
    expect(report.facts.blocking_reason_codes).not.toContain('section_id_duplicate');
    expect(report.facts.blocking_reason_codes).not.toContain('section_id_unknown');
    expect(report.facts.blocking_reason_codes).not.toContain('section_id_orphaned');
  });

  test('known section-id/title contradictions on machine sections fail closed', () => {
    const prd = sectionIdChineseReadyPrd()
      .replace(
        '<!-- prd:section=outstanding_questions -->\n## 未决问题',
        '<!-- prd:section=outstanding_questions -->\n## Readiness Self-Check',
      );

    const report = buildReport(
      'docs/brainstorms/mismatched-machine-section-id-requirements.md',
      prd,
    );

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'section_id_title_mismatch',
        section: 'outstanding_questions',
        actual_section: 'readiness_self_check',
      }),
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'outstanding_questions',
      }),
    ]));
    expect(report.facts.blocking_reason_codes).toContain('machine_section_identity_missing');
  });

  test('source_inputs is frontmatter accounting, not a valid body section id', () => {
    const report = buildReport(
      'docs/brainstorms/source-inputs-section-id-requirements.md',
      [
        sectionIdChineseReadyPrd(),
        '',
        '<!-- prd:section=source_inputs -->',
        '## 错误的正文输入来源锚点',
        'source_inputs belongs in frontmatter.',
      ].join('\n'),
    );

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason_code: 'section_id_unknown', section_id: 'source_inputs' }),
    ]));
    expect(report.facts.blocking_reason_codes).not.toContain('section_id_unknown');
  });

  test('duplicate machine-owned section id fails closed on final-ready path', () => {
    const report = buildReport(
      'docs/brainstorms/duplicate-machine-section-id-requirements.md',
      [
        sectionIdChineseReadyPrd(),
        '',
        '<!-- prd:section=readiness_self_check -->',
        '## 第二个自检',
        '- duplicate machine section',
      ].join('\n'),
    );

    expect(report.facts.blocking_reason_codes).toContain('machine_section_identity_missing');
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'readiness_self_check',
      }),
    ]));
  });

  test('final-ready machine-owned sections fail closed when neither canonical heading nor section-id exists', () => {
    const prd = sectionIdChineseReadyPrd()
      .replace('<!-- prd:section=outstanding_questions -->\n', '')
      .replace('<!-- prd:section=owner_decision_trace -->\n', '')
      .replace('<!-- prd:section=readiness_self_check -->\n', '');
    const report = buildReport('docs/brainstorms/missing-machine-section-id-requirements.md', prd);

    expect(report.facts.blocking_reason_codes).toContain('machine_section_identity_missing');
    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'outstanding_questions',
      }),
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'owner_decision_trace',
      }),
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'readiness_self_check',
      }),
    ]));
  });

  test('owner-owned OQ disposition requires Owner Decision Trace identity even without global asked-owner evidence', () => {
    const prd = sectionIdChineseReadyPrd({
      readiness: [
        '- write_mode: final-prd',
        '- clarification_evidence: source-proven-no-ask',
        '- can_enter_spec_plan: yes',
        '- preflight_sweep_closure: closed',
        '- decision_card_highest_risk_gap: owner disposition in OQ',
        '- decision_card_next_action: final-prd',
        '- decision_card_why_no_invention: OQ-01 claims owner closure',
      ],
    })
      .replace('<!-- prd:section=owner_decision_trace -->\n', '')
      .replace('## Owner 决策追踪', '## 决策追踪');

    const report = buildReport(
      'docs/brainstorms/owner-oq-needs-trace-identity-requirements.md',
      prd,
    );

    expect(report.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason_code: 'machine_section_identity_missing',
        section: 'owner_decision_trace',
      }),
    ]));
    expect(report.facts.blocking_reason_codes).toContain('machine_section_identity_missing');
  });
});

describe('parseHeaderedTable', () => {
  test('OQ 表:header-aware 解析 + 别名识别', () => {
    const table = [
      '| id | 问题 | prd write target | blocks_planning | closure_disposition |',
      '|----|------|------------------|-----------------|---------------------|',
      '| OQ-1 | auth scope? | R-01 permission | yes | owner-answered |',
    ].join('\n');
    const { headerMap, rows } = parseHeaderedTable(table, OQ_HEADER_ALIASES);
    expect(headerMap).toHaveProperty('id');
    expect(headerMap).toHaveProperty('question');
    expect(headerMap).toHaveProperty('prd_write_target');
    expect(headerMap).toHaveProperty('blocks_planning');
    expect(headerMap).toHaveProperty('closure_disposition');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('OQ-1');
    expect(rows[0].question).toBe('auth scope?');
    expect(rows[0].closure_disposition).toBe('owner-answered');
  });

  test('TRACE 表:decision/决策 别名作 question 列', () => {
    const table = [
      '| decision | owner_answer | chosen_answer | prd write target | consequence |',
      '|----------|--------------|---------------|------------------|-------------|',
      '| auth | owner said X | X | R-01 | must gate |',
    ].join('\n');
    const { headerMap, rows } = parseHeaderedTable(table, TRACE_HEADER_ALIASES);
    expect(headerMap).toHaveProperty('question');
    expect(rows[0].question).toBe('auth');
  });

  test('无表头别名识别时 headerMap 为空', () => {
    const table = [
      '| foo | bar |',
      '|-----|-----|',
      '| a | b |',
    ].join('\n');
    const { headerMap, rows } = parseHeaderedTable(table, OQ_HEADER_ALIASES);
    expect(Object.keys(headerMap)).toHaveLength(0);
    // 行仍被解析但 row 字段为空(无可识别列)
    expect(rows).toHaveLength(1);
  });

  test('空文本返回空结果', () => {
    const { headerMap, rows } = parseHeaderedTable('', OQ_HEADER_ALIASES);
    expect(headerMap).toEqual({});
    expect(rows).toEqual([]);
  });

  // 回归:prd_write_target 下划线别名(2026-06-28 日志暴露:模型写下划线版导致 trace 表 0 validRows 雪崩)
  test('OQ 表 prd_write_target 下划线版别名识别', () => {
    const table = [
      '| id | question | prd_write_target | blocks_planning | closure_disposition |',
      '|----|----------|------------------|-----------------|---------------------|',
      '| OQ-1 | auth scope? | R-01 permission | yes | owner-answered |',
    ].join('\n');
    const { headerMap, rows } = parseHeaderedTable(table, OQ_HEADER_ALIASES);
    expect(headerMap).toHaveProperty('prd_write_target');
    expect(rows[0].prd_write_target).toBe('R-01 permission');
  });

  test('TRACE 表 prd_write_target 下划线版别名识别', () => {
    const table = [
      '| question | owner_answer | chosen_answer | prd_write_target | consequence | closure_state |',
      '|----------|--------------|---------------|-------------------|-------------|----------------|',
      '| OQ-1 auth | owner said X | X | R-01 | must gate | closed |',
    ].join('\n');
    const { headerMap, rows } = parseHeaderedTable(table, TRACE_HEADER_ALIASES);
    expect(headerMap).toHaveProperty('prd_write_target');
    expect(rows[0].prd_write_target).toBe('R-01');
  });
});

// ────────────────────────────────────────────────────────
// P2: gateReadyClaims — claimsReady-gated findings 单测
// 直接传构造 facts + 空 oqAnalysis,无需整份 PRD fixture。
// ────────────────────────────────────────────────────────

function makeOqAnalysis(reasonCodes = []) {
  return { reasonCodes, facts: {} };
}

function baseFacts(overrides = {}) {
  return {
    ready_claim_present: true,
    preflight_sweep_closure: 'closed',
    ready_receipt_present: true,
    ready_receipt_current: true,
    design_sources_unread_non_empty: false,
    design_coverage_partial: false,
    design_degraded_owner_accepted: false,
    write_mode: 'final-prd',
    ...overrides,
  };
}

describe('gateReadyClaims', () => {
  test('claimsReady=false → 空数组', () => {
    const facts = baseFacts({ ready_claim_present: false });
    expect(gateReadyClaims(facts, makeOqAnalysis())).toEqual([]);
  });

  test('全条件正常 → 空数组', () => {
    expect(gateReadyClaims(baseFacts(), makeOqAnalysis())).toEqual([]);
  });

  test('preflight_sweep_closure=blocked → preflight_sweep_closure_blocked', () => {
    const findings = gateReadyClaims(baseFacts({ preflight_sweep_closure: 'blocked' }), makeOqAnalysis());
    expect(findings.map((f) => f.reason_code)).toContain('preflight_sweep_closure_blocked');
  });

  test('ready_receipt_present=false → ready_receipt_absent', () => {
    const findings = gateReadyClaims(
      baseFacts({ ready_receipt_present: false }),
      makeOqAnalysis(),
    );
    expect(findings.map((f) => f.reason_code)).toContain('ready_receipt_absent');
  });

  test('ready_receipt_present=true + current=false → ready_receipt_stale', () => {
    const findings = gateReadyClaims(
      baseFacts({ ready_receipt_present: true, ready_receipt_current: false }),
      makeOqAnalysis(),
    );
    expect(findings.map((f) => f.reason_code)).toContain('ready_receipt_stale');
  });

  test('oqAnalysis reasonCodes 透传到 findings', () => {
    const oq = makeOqAnalysis(['blocking_outstanding_question_present']);
    const findings = gateReadyClaims(baseFacts(), oq);
    expect(findings.map((f) => f.reason_code)).toContain('blocking_outstanding_question_present');
  });

  test('design_unread + !accepted → design_unread_without_owner_acceptance', () => {
    const findings = gateReadyClaims(
      baseFacts({ design_sources_unread_non_empty: true, design_degraded_owner_accepted: false }),
      makeOqAnalysis(),
    );
    expect(findings.map((f) => f.reason_code)).toContain('design_unread_without_owner_acceptance');
  });

  test('design_partial + accepted → 不触发 design_partial_coverage_unaccepted', () => {
    const findings = gateReadyClaims(
      baseFacts({ design_coverage_partial: true, design_degraded_owner_accepted: true }),
      makeOqAnalysis(),
    );
    expect(findings.map((f) => f.reason_code)).not.toContain('design_partial_coverage_unaccepted');
  });

  test('write_mode=checkpoint-prd + claimsReady → checkpoint_claims_ready', () => {
    const findings = gateReadyClaims(
      baseFacts({ write_mode: 'checkpoint-prd' }),
      makeOqAnalysis(),
    );
    expect(findings.map((f) => f.reason_code)).toContain('checkpoint_claims_ready');
  });

  test('preflight=closed + closure blocker → preflight_closure_contradicted', () => {
    // 注入一个 closure blocker code，触发 preflight_closure_contradicted
    const oq = makeOqAnalysis(['open_oq_without_owner_closure']);
    const findings = gateReadyClaims(baseFacts({ preflight_sweep_closure: 'closed' }), oq);
    expect(findings.map((f) => f.reason_code)).toContain('preflight_closure_contradicted');
  });
});

// 冻结契约 content freeze:OQ/Trace header alias 表与 how-pushdown 词表的完整内容。
// 注释声称"扩展须加 fixture",本测试把这个承诺变成可执行断言。
// 变更任何别名或关键词时必须同步更新此处,防止静默漂移。
describe('header alias 表与 WHAT_TOUCHING_KEYWORDS content freeze', () => {
  test('OQ_HEADER_ALIASES canonical keys 集合不变', () => {
    expect(Object.keys(OQ_HEADER_ALIASES).sort()).toEqual([
      'blocks_planning', 'closure_disposition', 'closure_state',
      'id', 'owner_status', 'planning_would_invent_what',
      'prd_write_target', 'question', 'recommended_default',
    ]);
  });

  test('OQ_HEADER_ALIASES 各 key 别名表内容不变', () => {
    expect(OQ_HEADER_ALIASES.id).toEqual(['id', '编号']);
    expect(OQ_HEADER_ALIASES.question).toEqual(['question', '问题']);
    expect(OQ_HEADER_ALIASES.prd_write_target).toEqual(['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标']);
    expect(OQ_HEADER_ALIASES.owner_status).toEqual(['owner_status', 'owner status', 'owner状态', '澄清状态']);
    expect(OQ_HEADER_ALIASES.blocks_planning).toEqual(['blocks_planning', 'blocks planning?', 'blocks planning', '是否阻塞规划', '阻塞规划']);
    expect(OQ_HEADER_ALIASES.closure_disposition).toEqual(['closure_disposition', 'disposition', 'closure disposition', '闭合方式', '闭合依据']);
    expect(OQ_HEADER_ALIASES.planning_would_invent_what).toEqual(['planning_would_invent_what', 'planning would invent what?', 'planning would invent what', '是否会发明what', '会否发明what']);
    expect(OQ_HEADER_ALIASES.closure_state).toEqual(['closure_state', 'closure state', '闭合状态']);
    expect(OQ_HEADER_ALIASES.recommended_default).toEqual(['recommended_default', 'recommended default', 'deferred_reason', 'deferred reason', '推荐默认', '延后原因', '默认/延后原因']);
  });

  test('TRACE_HEADER_ALIASES canonical keys 集合不变', () => {
    expect(Object.keys(TRACE_HEADER_ALIASES).sort()).toEqual([
      'chosen_answer', 'closure_state', 'consequence',
      'owner_answer', 'prd_write_target', 'question',
    ]);
  });

  test('TRACE_HEADER_ALIASES 各 key 别名表内容不变', () => {
    expect(TRACE_HEADER_ALIASES.question).toEqual(['question', 'decision', '问题', '决策']);
    expect(TRACE_HEADER_ALIASES.owner_answer).toEqual(['owner_answer', 'owner answer', 'owner_answer/source', 'owner回答', '回答/来源']);
    expect(TRACE_HEADER_ALIASES.chosen_answer).toEqual(['chosen_answer', 'chosen answer', '采纳答案', '最终答案']);
    expect(TRACE_HEADER_ALIASES.prd_write_target).toEqual(['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标']);
    expect(TRACE_HEADER_ALIASES.consequence).toEqual(['consequence', 'readiness consequence', '影响', '后果']);
    expect(TRACE_HEADER_ALIASES.closure_state).toEqual(['closure_state', 'closure state', '闭合状态']);
  });

  test('WHAT_TOUCHING_KEYWORDS 词表内容不变(how-pushdown 误分类冻结契约)', () => {
    expect(WHAT_TOUCHING_KEYWORDS).toEqual([
      'interface', '接口', 'availability', '可用性', 'permission', '权限',
      'scope', '范围', 'source-of-truth', '数据权威', 'fallback', '降级',
      'analytics', '埋点', '指标',
    ]);
  });
});
