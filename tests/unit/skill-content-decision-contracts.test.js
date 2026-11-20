'use strict';

const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.resolve(__dirname, '../../skills', file), 'utf8');

describe('七项用户输入与交付边界', () => {
  test.each(['spec-work/references/input-triage.md', 'spec-plan/references/intake.md', 'spec-plan/references/final-review.md'])('%s 不把同名当作转换证据', (file) => {
    expect(read(file)).toMatch(/A matching name does not establish succession|同名不是后继证据/);
  });

  test('只转写有独立交付出口且不默认授权外发', () => {
    const entry = read('spec-riffrec-feedback-analysis/SKILL.md');
    expect(entry).toContain('**Transcript only**: When the user wants a transcript, recording length does not change the deliverable into a bug report');
    expect(entry).not.toMatch(/Quick bug report[^\n]*just transcribe/i);
    expect(read('spec-riffrec-feedback-analysis/references/quick-bug-report.md')).not.toContain('just transcribe');
    expect(entry).toContain('transcription_egress_authorization');
  });

  test('首次访谈与目标仓库缺失分别处理', () => {
    expect(read('spec-product-pulse/references/config.md')).toContain('without initiating interviews');
    expect(read('spec-product-pulse/SKILL.md')).not.toContain('An absent root/config');
  });

  test('自选交接路径不依赖托管写入回执', () => {
    expect(read('spec-handoff/SKILL.md')).toContain('do not require or generate');
  });

  test('有足够材料的内部备选方案可裁决', () => {
    expect(read('spec-pov/SKILL.md')).toContain('Whether the scheme comes from internal or external sources is not a diversion condition');
  });

  test('只读不等于无法互动', () => {
    const entry = read('spec-prd/SKILL.md');
    expect(entry).not.toContain('explicit headless/report-only mode');
    expect(entry).toContain('report-only only constrains writing');
  });

  test('反馈引用规则接受两种完整 Git OID，拒绝混入额外字符', () => {
    const source = read('spec-sweep/references/run.md');
    const pattern = source.match(/a commit reference matches the full string pattern `([^`]+)`/);
    expect(pattern).not.toBeNull();
    const accepts = new RegExp(pattern[1]);
    for (const length of [7, 40, 64]) expect(accepts.test('a'.repeat(length))).toBe(true);
    for (const input of ['a'.repeat(6), 'a'.repeat(65), '--help', 'abc1234 extra']) expect(accepts.test(input)).toBe(false);
    expect(read('spec-sweep/SKILL.md')).not.toContain('[0-9a-f]{7,40}');
  });
});
