'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const ROLE_CONTRACT_PATH = 'docs/10-prompt/结构化项目角色契约.md';

describe('project role contract governance', () => {
  test('host instruction sources reference the readable canonical role contract', () => {
    const absoluteContractPath = path.join(REPO_ROOT, ROLE_CONTRACT_PATH);

    expect(fs.statSync(absoluteContractPath).isFile()).toBe(true);
    for (const instructionFile of ['AGENTS.md', 'CLAUDE.md']) {
      const contents = fs.readFileSync(path.join(REPO_ROOT, instructionFile), 'utf8');
      expect(contents).toContain(`\`${ROLE_CONTRACT_PATH}\``);
    }
  });

  test('canonical role contract keeps the host and project ownership boundary explicit', () => {
    const contents = fs.readFileSync(path.join(REPO_ROOT, ROLE_CONTRACT_PATH), 'utf8');

    expect(contents).toContain('**Host** 提供 agent、工具、权限与执行 primitive，决定任务如何运行。');
    expect(contents).toContain('**spec-first** 连接 intent、context、scope、claim、evidence、handoff 与 knowledge');
    expect(contents).toContain('长期价值属于项目，而非宿主');
    expect(contents).toContain('不应成为 prompt / agent 集合、强状态机、中心化流程引擎、通用 agent runtime');
  });
});
