'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const { hasSharedSkillsRootConsumer, planManagedAssetRemoval } = require('../../src/cli/state');

// 共享 .agents/skills 消费者保护的 fail-closed 回归：兄弟宿主 state 损坏或缺失
// 但 runtime 面仍在时，clean 不得删除其他宿主仍在消费的共享投影（审查 finding：
// 与 AGENTS.md 消费者判定的 uncertain→preserve 口径对齐）。
function writeInstalledState(projectRoot, adapter) {
  const statePath = path.join(projectRoot, adapter.stateFile);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify({
    platform: adapter.id,
    manifestVersion: 'managed-state/v1',
    commands: [],
    skills: ['spec-work'],
    workflowSkills: [],
    agents: [],
    agentSupportFiles: [],
  })}\n`, 'utf8');
}

function managedStateFor(adapter) {
  return {
    platform: adapter.id,
    manifestVersion: 'managed-state/v1',
    commands: [],
    skills: ['spec-work'],
    workflowSkills: [],
    agents: [],
    agentSupportFiles: [],
  };
}

describe('shared skills root consumer protection fails closed', () => {
  test('corrupt sibling state preserves the shared projection (clean --codex with broken zcode state)', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-corrupt-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));
      writeInstalledState(projectRoot, getAdapter('zcode'));
      // 损坏 zcode state：readState 抛错
      fs.writeFileSync(path.join(projectRoot, '.zcode/spec-first/state.json'), '{ not valid json');

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('codex'))).toBe(true);

      const plan = planManagedAssetRemoval(projectRoot, managedStateFor(getAdapter('codex')), getAdapter('codex'));
      expect(plan.skippedSharedSkills).toBe(true);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('missing sibling state with surviving managed root preserves the shared projection', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-missing-state-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));
      // zcode 未装 state，但 .zcode/spec-first 受管面仍在（如手工删 state.json）
      fs.mkdirSync(path.join(projectRoot, '.zcode', 'spec-first'), { recursive: true });

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('codex'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('a fully absent sibling surface still releases the shared projection (last consumer removes)', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-last-consumer-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('codex'))).toBe(false);

      const plan = planManagedAssetRemoval(projectRoot, managedStateFor(getAdapter('codex')), getAdapter('codex'));
      expect(plan.skippedSharedSkills).toBe(false);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('healthy sibling state preserves the shared projection (pre-existing behavior locked)', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-healthy-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));
      writeInstalledState(projectRoot, getAdapter('pi'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('codex'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
