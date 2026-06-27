'use strict';

// P1: checker 纯函数 in-process 单测。
// 之前 contracts 测试 100% 走 execFileSync 子进程端到端,根因是纯函数未导出;
// 只能通过 buildReport 间接触达,edge case 靠整份 PRD fixture 偶然覆盖。
// 此文件 in-process 直测纯函数分支逻辑,不构造整份 PRD,可断点调试、快且稳。

const {
  looksLikeCheckableRef,
  traceRowBindsOq,
  isEmptyish,
  matchHeadingTitle,
  stripHeadingDecoration,
  parseHeaderedTable,
  OQ_HEADER_ALIASES,
  TRACE_HEADER_ALIASES,
} = require('../../skills/spec-prd/scripts/check-prd-artifact');

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
});
