'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GUIDE_PATHS = [
  path.join(REPO_ROOT, 'docs/03-实施方案/07-新增-Skill-接入通用指南.md'),
  path.join(REPO_ROOT, 'docs/07-经验总结/2026-03-30-新增-skill-agent-标准操作清单.md'),
  path.join(REPO_ROOT, 'docs/07-经验总结/2026-03-30-codex-打包发布经验总结.md'),
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('contributor guide contracts', () => {
  test('active Codex guidance does not revive retired runtime paths', () => {
    for (const guidePath of GUIDE_PATHS) {
      const guide = read(guidePath);
      const relativePath = path.relative(REPO_ROOT, guidePath);

      if (guide.includes('.codex/skills/')) {
        throw new Error(`${relativePath} refers to retired .codex/skills runtime path`);
      }
      if (guide.includes('同时会生成 `.codex/commands/spec/')) {
        throw new Error(`${relativePath} says Codex commands are still generated`);
      }
      if (guide.includes('.claude-plugin/plugin.json')) {
        throw new Error(`${relativePath} refers to retired .claude-plugin manifest`);
      }
    }
  });

  test('Codex packaging lessons mark command files as legacy cleanup only', () => {
    const codexPackaging = read(GUIDE_PATHS[2]);

    expect(codexPackaging).toContain('旧命令层清理目标：`.codex/commands/spec/`');
    expect(codexPackaging).toContain('正式 discovery / skill 入口：`spec-*`');
    expect(codexPackaging).toContain('不再生成到 `.codex/commands/spec/`');
    expect(codexPackaging).toContain('清理目标');
  });
});
