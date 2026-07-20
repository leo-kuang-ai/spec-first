'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

jest.mock('../../src/cli/external-command', () => ({
  isCommandTimeout: () => false,
  spawnSyncWithTimeout: (command) => ({
    status: 0,
    stdout: `${command} test-version\n`,
  }),
}));

jest.mock('../../src/cli/plugin', () => {
  const actual = jest.requireActual('../../src/cli/plugin');
  const nodePath = require('node:path');
  return {
    ...actual,
    inspectInstalledAssets: (projectRoot, adapter) => ({
      ...actual.inspectInstalledAssets(projectRoot, adapter),
      agents: {
        targetRoot: nodePath.join(projectRoot, adapter.agentsRoot),
        entries: [],
        missing: [],
        drifted: [],
      },
    }),
  };
});

const { getAdapter } = require('../../src/cli/adapters');
const { runDoctor } = require('../../src/cli/commands/doctor');
const { syncSkills } = require('../../src/cli/plugin');

describe('doctor runtime asset inventory', () => {
  test('passes a missing agents directory when the bundled agent inventory is empty', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-assets-'));
    const previousCwd = process.cwd();
    const adapter = getAdapter('claude');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);

      expect(runDoctor(['--claude', '--json'])).toBe(0);
      const report = JSON.parse(log.mock.calls.at(-1)[0]);
      const agentsCheck = report.platform_checks.claude.find((check) =>
        check.name === adapter.agentsRoot
      );

      expect(fs.existsSync(path.join(projectRoot, adapter.agentsRoot))).toBe(false);
      expect(agentsCheck).toEqual({
        level: 'PASS',
        name: adapter.agentsRoot,
        message: 'no bundled agents',
      });
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('reports Claude skill and workflow roots with their physical inventory counts', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-claude-skills-'));
    const previousCwd = process.cwd();
    const adapter = getAdapter('claude');
    const synced = syncSkills(projectRoot, adapter);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);

      expect(runDoctor(['--claude', '--json'])).toBe(0);
      const report = JSON.parse(log.mock.calls.at(-1)[0]);
      const skillsCheck = report.platform_checks.claude.find((check) =>
        check.name === adapter.skillsRoot
      );
      const skillsRootCount = synced.skills.length + synced.internalSkills.length;

      expect(skillsRootCount).toBe(16);
      expect(synced.workflowSkills).toHaveLength(17);
      expect(skillsCheck).toEqual({
        level: 'PASS',
        name: adapter.skillsRoot,
        message: `found ${skillsRootCount} standalone/internal skill directory(ies) in ${adapter.skillsRoot} and ${synced.workflowSkills.length} workflow mirror directory(ies) in ${adapter.workflowsRoot}`,
      });
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps the total skill count for hosts that share one skill and workflow root', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-kiro-skills-'));
    const previousCwd = process.cwd();
    const adapter = getAdapter('kiro');
    const synced = syncSkills(projectRoot, adapter);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);

      expect(runDoctor(['--kiro', '--json'])).toBe(0);
      const report = JSON.parse(log.mock.calls.at(-1)[0]);
      const skillsCheck = report.platform_checks.kiro.find((check) =>
        check.name === adapter.skillsRoot
      );
      const total = synced.skills.length + synced.internalSkills.length + synced.workflowSkills.length;

      expect(skillsCheck).toEqual({
        level: 'PASS',
        name: adapter.skillsRoot,
        message: `found ${total} skill directory(ies)`,
      });
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
