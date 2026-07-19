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

  test.each(['spec-commit', 'spec-commit-push-pr'])(
    '%s is delivered only as an internal helper',
    (skillName) => {
      const skill = read(`skills/${skillName}/SKILL.md`);
      const governance = JSON.parse(read('src/cli/contracts/dual-host-governance/skills-governance.json'));
      const record = governance.skills.find((entry) => entry.skill_name === skillName);

      expect(skill).toMatch(/^user-invocable:\s*false$/m);
      expect(skill).toMatch(/workflow invocation does not authorize/i);
      expect(record).toMatchObject({
        entry_surface: 'internal_only',
        command_name: null,
      });
    },
  );

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

  test('compound refresh points YAML safety guidance at root AGENTS.md', () => {
    const compound = read('skills/spec-compound/references/yaml-schema.md');
    const refresh = read('skills/spec-compound-refresh/references/yaml-schema.md');

    expect(refresh).toContain('see root\n`AGENTS.md` under "YAML Frontmatter"');
    expect(refresh).not.toContain('see plugin\n`AGENTS.md`');
    expect(refresh).toBe(compound);
  });
});
