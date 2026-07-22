'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { planRuntimeUntrack } = require('../../src/cli/runtime-untrack');

describe('runtime untrack policy', () => {
  test('selects namespaced generated runtime without selecting shareable or team-policy assets', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-untrack-'));
    const generatedPaths = [
      '.agents/skills/spec-plan/SKILL.md',
      '.agents/skills/source-command-spec-plan/SKILL.md',
      '.claude/skills/using-spec-first/SKILL.md',
      '.codex/spec-first/state.json',
    ];
    const preservedPaths = [
      '.agents/skills/my-team-skill/SKILL.md',
      '.claude/agents/my-reviewer.md',
      '.codex/config.toml',
      '.cursor/mcp.json',
      '.kiro/settings/user-setting.json',
      '.qoder/hooks/session-start',
      '.qoder/skills/my-team-skill/SKILL.md',
      '.graphify/graph.json',
    ];

    try {
      execFileSync('git', ['init', '-q'], { cwd: repoRoot });
      for (const relativePath of [...generatedPaths, ...preservedPaths]) {
        writeFile(repoRoot, relativePath);
      }
      execFileSync('git', ['add', '.'], { cwd: repoRoot });

      const plan = planRuntimeUntrack({ projectRoot: repoRoot });
      const plannedPaths = plan.operations.map((operation) => operation.path);

      expect(plannedPaths).toEqual(expect.arrayContaining(generatedPaths));
      expect(plannedPaths).not.toEqual(expect.arrayContaining(preservedPaths));
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

function writeFile(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, 'test\n', 'utf8');
}
