'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', '..', 'skills', 'spec-prototype');

describe('spec-prototype canonical contract', () => {
  test('has a governed source tree and no sibling imports', () => {
    const files = [
      'SKILL.md',
      'references/craft-floor.md',
      'references/preview.md',
      'references/write-back.md',
      'scripts/light-webserver.js',
    ];
    for (const relative of files) {
      const file = path.join(root, relative);
      expect(fs.existsSync(file)).toBe(true);
      expect(fs.readFileSync(file, 'utf8')).not.toMatch(/\.\.\/[A-Za-z]/);
    }
  });

  test('keeps human experience, throwaway, and no-proof boundaries visible', () => {
    const skill = fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8');
    expect(skill).toContain('blocked-human-experience-required');
    expect(skill).toContain('decisions.md');
    expect(skill).toContain('spec-brainstorm');
    expect(skill).toContain('spec-plan');
    expect(skill).toContain('spec-proof');
    expect(skill).toContain('awaiting-go-ahead');
    expect(skill).toContain('preview-running');
    expect(skill).toContain('awaiting-human-decision');
    expect(skill).toMatch(/not a persisted workflow state machine/i);
    expect(skill).toContain('127.0.0.1');
    expect(skill).toContain('instance identity');
  });

  test('preview uses ignored in-repo storage before platform-native temp fallback', () => {
    const preview = fs.readFileSync(path.join(root, 'references/preview.md'), 'utf8');
    expect(preview.indexOf('.context/compound-engineering/')).toBeGreaterThan(-1);
    expect(preview).toContain('os.tmpdir()');
    expect(preview).not.toContain('/tmp/compound-engineering-');
    expect(preview).not.toContain('id -u');
    expect(preview).not.toContain('chmod 700');
  });
});
