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
