'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const consumers = [
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

describe('fresh repo grounding contracts', () => {
  test.each(consumers)('%s has a current-source path and an honest degraded path', (skill) => {
    const skillDir = path.join(repoRoot, 'skills', skill);
    const source = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');

    expect(source).toMatch(/current (?:target repo\/worktree|target repo|git identity|target)/i);
    expect(source).toMatch(/dirty state|dirty worktree/i);
    expect(source).toMatch(/never (?:persist or )?reuse|do not persist or reuse/i);
    expect(source).toMatch(/degraded fact|narrow .*claims|limit its claims/i);
    expect(fs.existsSync(path.join(skillDir, 'references', 'repo-profile-cache.md'))).toBe(false);
    expect(fs.existsSync(path.join(skillDir, 'references', 'agents', 'repo-profiler.md'))).toBe(false);
    expect(fs.existsSync(path.join(skillDir, 'scripts', 'repo-profile-cache.py'))).toBe(false);
  });

  test('retired cache vocabulary and routes are absent from active consumer packages', () => {
    for (const skill of consumers) {
      const skillDir = path.join(repoRoot, 'skills', skill);
      const paths = listFiles(skillDir);
      for (const filePath of paths) {
        const source = fs.readFileSync(filePath, 'utf8');
        expect(source).not.toMatch(/repo-profile-cache|references\/agents\/repo-profiler|`(?:HIT|MISS|NO-CACHE)`/);
      }
    }
  });
});

function listFiles(root) {
  const paths = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) paths.push(...listFiles(absolutePath));
    else if (entry.isFile()) paths.push(absolutePath);
  }
  return paths;
}
