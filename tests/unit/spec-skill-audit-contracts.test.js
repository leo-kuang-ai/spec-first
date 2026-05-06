'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-skill-audit', 'SKILL.md');

describe('spec-skill-audit governance pilot contract', () => {
  test('uses ECC governance pilot facts as advisory input without replacing audit judgment', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('scripts/prepare-ecc-workflow-pilot-brief.js --workflow spec-skill-audit');
    expect(text).toContain('candidate facts, not selected auditors');
    expect(text).toContain('not final audit verdicts');
    expect(text).toContain('does not use graph or optional-pack components in this pilot');
    expect(text).toContain('skipped as unsupported without degrading the audit');
    expect(text).toContain('Do not run external connectors, call graph providers, modify repo-profile');
    expect(text).toContain('`.claude/`, `.codex/`, `.agents/skills/`');
    expect(text).toContain('ECC governance pilot facts unavailable');
  });
});
