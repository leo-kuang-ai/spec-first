'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '../..');
const ROLE_CONTRACT_PATH = 'docs/10-prompt/结构化项目角色契约.md';
const METHODOLOGY_PATH = 'docs/10-prompt/AI-Coding-Harness演化方法论.md';

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

  test('canonical role contract preserves L0 strategic direction and proportional evidence', () => {
    const contents = fs.readFileSync(path.join(REPO_ROOT, ROLE_CONTRACT_PATH), 'utf8');

    expect(contents).toContain('**AI Coding Harness for spec-driven software engineering**');
    expect(contents).toContain('Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge');
    expect(contents).toContain('可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据');
    expect(contents).toContain('系统复利 = 可信变更 × 可失效学习');
    expect(contents).toMatch(/缺少授权时.*缺少能力时.*缺少可回源证据时/);
    expect(contents).toContain('普通任务只承担与当前 claim、风险和影响面相称的证据义务');
    expect(contents).toContain('只有 owning source 变更确实影响相关 runtime');
  });

  test('current methodology consumes the L0 trusted-change and system-learning split', () => {
    const methodology = fs.readFileSync(path.join(REPO_ROOT, METHODOLOGY_PATH), 'utf8');

    expect(methodology).toContain('可信变更 = 清晰意图 × 有效上下文 × 有界执行 × 可核验证据');
    expect(methodology).toContain('系统复利 = 可信变更 × 可失效学习');
    expect(methodology).not.toContain('可核验证据 × 可失效学习');
  });
});
