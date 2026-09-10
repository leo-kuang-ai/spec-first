'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../skills/spec-strategy');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('strategy source contracts', () => {
  test('every entrypoint reference exists and carries nonempty source', () => {
    const references = [...read('SKILL.md').matchAll(/references\/[a-z-]+\.md/g)]
      .map((match) => match[0]);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of new Set(references)) {
      expect({ reference, exists: fs.existsSync(path.join(root, reference)) })
        .toEqual({ reference, exists: true });
      expect(read(reference).trim().length).toBeGreaterThan(0);
    }
  });

  test('routes updates through their required read before selecting or editing a section', () => {
    const entry = read('SKILL.md');
    const phaseZero = entry.split('### Phase 0:')[1].split('### Phase 1:')[0];
    const update = entry.split('### Phase 2:')[1].split('### Phase 3:')[0];
    expect(phaseZero).not.toMatch(/Ask which section/i);
    expect(update).toContain('references/update-run.md');
    expect(update).toMatch(/摘要、漂移检查或提问之前/);
    expect(read('references/grounding.md')).toContain('近期提交只说明注意力');
    expect(read('references/grounding.md')).toContain('正常路径');
  });

  test('updates preserve author protection, foreign document shape, and untargeted content', () => {
    const update = read('references/update-run.md');
    expect(update).toContain('author-approved');
    expect(update).toContain('标题与正文均不得修改');
    expect(update).toContain('不自动套模板');
    expect(update).toContain('其他章节的内容和位置保持不变');
    expect(update).toContain('没有 frontmatter 就不新增');
    expect(update).toContain('候选');
    expect(update).toContain('不得当作战略已经改变');
  });

  test('interview and template agree on strategy boundaries without renaming local consumers', () => {
    const entry = read('SKILL.md');
    const interview = read('references/interview.md');
    const template = read('references/strategy-template.md');
    expect(entry).toContain('Stress test');
    expect(interview).toContain('## Stress Test');
    expect(interview).toContain('最多两轮');
    expect(template).toContain('## Not working on');
    expect(template).toContain('必填');
    expect(template).toContain('## Target problem');
    expect(template).toContain('## Our approach');
    expect(template).toContain("## Who it's for");
  });
});
