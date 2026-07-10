'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-doc-review/SKILL.md'), 'utf8');

describe('spec-doc-review current contracts', () => {
  test('asks for or discovers a document when none is supplied', () => {
    expect(skill).toContain('If no document is specified');
    expect(skill).toContain('Ask which document to review');
  });

  test('classifies unified requirements and plans by readiness', () => {
    expect(skill).toContain('artifact_readiness: requirements-only');
    expect(skill).toContain('classify as `unified-requirements`');
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('classify as `unified-plan`');
  });

  test('does not infer document kind from path alone', () => {
    expect(skill).toMatch(/content shape.*not its file path/);
    expect(skill).toMatch(/Path is a tie-breaker hint/);
  });
});
