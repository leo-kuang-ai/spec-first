'use strict';

const fs = require('node:fs');

const brainstormPath = 'skills/spec-brainstorm/SKILL.md';
const visualReference = 'skills/spec-brainstorm/references/visual-probes.md';
const visualServer = 'skills/spec-brainstorm/scripts/visual-probe-server.js';

describe('spec-brainstorm visual helper retirement', () => {
  test('removes the visual helper source surface', () => {
    const brainstorm = fs.readFileSync(brainstormPath, 'utf8');

    expect(fs.existsSync(visualReference)).toBe(false);
    expect(fs.existsSync(visualServer)).toBe(false);
    expect(brainstorm).not.toMatch(/visual-probe|visual-probes|text-vs-visual|bundled browser helper/i);
    expect(brainstorm).not.toContain('/version');
    expect(brainstorm).not.toContain('/files');
  });

  test('keeps visual decisions in the conversation-native main path', () => {
    const brainstorm = fs.readFileSync(brainstormPath, 'utf8');

    expect(brainstorm).toContain('comparison table, state sequence, ASCII wireframe, or read-only source screenshot');
    expect(brainstorm).toContain('close the affected Requirement, Acceptance Example, or Scope blocker normally');
    expect(brainstorm).toContain('future evidence need');
    expect(brainstorm).toContain('Do not generate HTML, CSS, or JavaScript');
    expect(brainstorm).toContain('one question at a time');
  });
});
