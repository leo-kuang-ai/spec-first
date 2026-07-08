'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

const CONSUMER_SKILLS = [
  'spec-brainstorm',
  'spec-code-review',
  'spec-compound',
  'spec-debug',
  'spec-explain',
  'spec-ideate',
  'spec-optimize',
  'spec-plan',
  'spec-pov',
];

const PARITY_FILES = [
  'references/repo-profile-cache.md',
  'scripts/repo-profile-cache.py',
  'references/agents/repo-profiler.md',
];

function readSkillFile(skillName, relativePath) {
  return fs.readFileSync(path.join(ROOT, 'skills', skillName, relativePath), 'utf8');
}

describe('repo profile cache parity', () => {
  test('repo-grounding consumers keep byte-identical cache protocol assets', () => {
    for (const relativePath of PARITY_FILES) {
      const expected = readSkillFile(CONSUMER_SKILLS[0], relativePath);

      for (const skillName of CONSUMER_SKILLS.slice(1)) {
        expect(readSkillFile(skillName, relativePath)).toBe(expected);
      }
    }
  });

  test('repo profile cache uses spec-first cache namespace', () => {
    for (const skillName of CONSUMER_SKILLS) {
      const reference = readSkillFile(skillName, 'references/repo-profile-cache.md');
      const script = readSkillFile(skillName, 'scripts/repo-profile-cache.py');

      expect(reference).toContain('/tmp/spec-first/repo-profile');
      expect(script).toContain('CACHE_ROOT = "/tmp/spec-first/repo-profile"');
      expect(reference).not.toContain('/tmp/compound-engineering/repo-profile');
      expect(script).not.toContain('/tmp/compound-engineering/repo-profile');
    }
  });
});
