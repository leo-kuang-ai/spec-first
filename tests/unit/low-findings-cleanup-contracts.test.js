'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('low-severity skill cleanup contracts', () => {
  test('spec-test-browser is explicitly internal-only at source and governance layers', () => {
    const skill = read('skills/spec-test-browser/SKILL.md');
    const governance = JSON.parse(read('src/cli/contracts/dual-host-governance/skills-governance.json'));
    const record = governance.skills.find((entry) => entry.skill_name === 'spec-test-browser');

    expect(skill).toMatch(/^user-invocable:\s*false$/m);
    expect(record).toMatchObject({
      entry_surface: 'internal_only',
      command_name: null,
    });
  });

  test('spec-sweep first-run write list includes every configured sweep key', () => {
    const interview = read('skills/spec-sweep/references/interview.md');
    const list = interview.match(/Write these keys[\s\S]*?Then surface the resulting Sweep section/);

    expect(list).not.toBeNull();
    for (const key of [
      'feedback_sources',
      'sweep_state_path',
      'sweep_ack_cap',
      'sweep_lease_ttl_minutes',
      'sweep_shared_branch',
    ]) {
      expect(list[0]).toContain(`\`${key}\``);
    }
  });

  test('Python cache artifacts remain excluded from source control', () => {
    const gitignore = read('.gitignore');
    expect(gitignore).toMatch(/^__pycache__\/$/m);
    expect(gitignore).toMatch(/^\*\.pyc$/m);
  });
});
