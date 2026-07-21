'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('shared Markdown rendering contract', () => {
  test('keeps plan, brainstorm, and ideate renderer text in parity', () => {
    const brainstorm = read('skills/spec-brainstorm/references/markdown-rendering.md');
    const plan = read('skills/spec-plan/references/markdown-rendering.md');
    const ideate = read('skills/spec-ideate/references/markdown-rendering.md');

    expect(plan).toBe(brainstorm);
    expect(ideate).toBe(brainstorm);
  });

  test('delegates lifecycle applicability to each section contract', () => {
    const renderer = read('skills/spec-plan/references/markdown-rendering.md');
    const ideationSections = read('skills/spec-ideate/references/ideation-sections.md');

    expect(renderer).toContain('Lifecycle fields are section-contract-owned');
    expect(renderer).toMatch(/Do not invent or suppress\s+`status` in the renderer/);
    expect(renderer).not.toContain('**No status / lifecycle field.**');
    expect(ideationSections).toContain('**No status field — not on the doc, not per idea.**');
  });
});

describe('shared HTML rendering consumer contract', () => {
  const renderers = {
    brainstorm: read('skills/spec-brainstorm/references/html-rendering.md'),
    plan: read('skills/spec-plan/references/html-rendering.md'),
    ideate: read('skills/spec-ideate/references/html-rendering.md'),
  };

  test('recognizes spec-doc-review as a report-only HTML consumer without mutation authority', () => {
    for (const renderer of Object.values(renderers)) {
      expect(renderer).toContain('report-only `spec-doc-review`');
      expect(renderer).toContain('`spec-work` only for implementation-ready');
      expect(renderer).toMatch(/it is not a consumer of\s+requirements-only brainstorm or ideation HTML/);
      expect(renderer).toContain('mutation_policy: report-only');
      expect(renderer).toContain('mutation_reason: html-artifact');
      expect(renderer).toContain('fixes_applied: 0');
      expect(renderer).toMatch(/does not grant\s+document mutation authority/i);
      expect(renderer).not.toContain('not a current HTML consumer');
      expect(renderer).not.toContain('*not* currently an HTML consumer');
      expect(renderer).not.toContain('consumers that read HTML today (`spec-work`');
      expect(renderer).not.toContain('Downstream agents that read HTML today (`spec-work`');
    }
  });

  test('keeps the ideate renderer free of plan-specific consumer prose', () => {
    expect(renderers.ideate).not.toContain('spec-plan handoff');
    expect(renderers.ideate).not.toContain('5.3.8 doc-review pass');
  });
});
