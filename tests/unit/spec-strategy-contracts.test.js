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
    expect(update).toContain('Before the summary, drift check, or questions');
    expect(read('references/grounding.md')).toContain('recent commits show attention only');
    expect(read('references/grounding.md')).toContain('normal path');
  });

  test('updates preserve author protection, foreign document shape, and untargeted content', () => {
    const update = read('references/update-run.md');
    expect(update).toContain('author-approved');
    expect(update).toContain('preserve both heading and body');
    expect(update).toContain('do not impose the template');
    expect(update).toContain("preserve untargeted sections' content and position");
    expect(update).toContain('Do not add frontmatter when absent');
    expect(update).toContain('candidates');
    expect(update).toContain('never as a verdict that strategy has changed');
  });

  test('interview and template agree on strategy boundaries without renaming local consumers', () => {
    const entry = read('SKILL.md');
    const interview = read('references/interview.md');
    const template = read('references/strategy-template.md');
    expect(entry).toContain('Stress test');
    expect(interview).toContain('## Stress Test');
    expect(interview).toContain('two rounds maximum');
    expect(template).toContain('## Not working on');
    expect(template).toContain('required in a new document');
    expect(template).toContain('## Target problem');
    expect(template).toContain('## Our approach');
    expect(template).toContain("## Who it's for");
  });

  test('shared document maintenance distinguishes ownership and preserves legacy sources', () => {
    const update = read('references/update-run.md');
    const grounding = read('references/grounding.md');
    expect(update).toContain('solely-owned');
    expect(update).toContain('multi-writer');
    expect(update).toContain('at least one');
    expect(update).toContain('do not reorder');
    expect(grounding).toContain('fold');
    expect(grounding).toContain('link');
    expect(grounding).toContain('Neither option edits or deletes the legacy file');
    const template = read('references/strategy-template.md').split('~~~markdown')[1];
    expect(template.indexOf('## Not working on')).toBeLessThan(template.indexOf('## Key metrics'));
  });

  test('pulse setup and reports consume the same current strategy source contract', () => {
    const pulse = path.resolve(root, '../spec-product-pulse');
    for (const file of ['references/setup.md', 'references/report-template.md']) {
      const content = fs.readFileSync(path.join(pulse, file), 'utf8');
      expect(content).toContain('strategy-source.md');
    }
    const source = fs.readFileSync(path.join(pulse, 'references/strategy-source.md'), 'utf8');
    expect(source).toContain('STRATEGY.md');
    expect(source.indexOf('VISION.md')).toBeLessThan(source.indexOf('PRODUCT.md'));
    expect(source).toContain('every run');
    expect(source).toContain('by meaning');
    expect(source).toContain('explicitly');
    expect(source).toContain('never rewrites');
  });
});
