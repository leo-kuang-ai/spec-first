'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

jest.mock('../../src/cli/external-command', () => ({
  isCommandTimeout: () => false,
  spawnSyncWithTimeout: jest.fn((command) => ({
    status: 0,
    stdout: `${command} test-version\n`,
  })),
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
const { spawnSyncWithTimeout } = require('../../src/cli/external-command');

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

  test('keeps JSON output authoritative when verbose is also requested', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-json-verbose-'));
    const previousCwd = process.cwd();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);

      expect(runDoctor(['--claude', '--json', '--verbose'])).toBe(0);
      const output = log.mock.calls.at(-1)[0];
      const report = JSON.parse(output);

      expect(report.platforms).toEqual(['claude']);
      expect(output).not.toContain('诊断结果：');
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps JSON and verbose JSON ERROR exits at code 3 without human output', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-json-error-'));
    const previousCwd = process.cwd();
    const previousVersion = Object.getOwnPropertyDescriptor(process, 'version');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);
      Object.defineProperty(process, 'version', { value: 'v18.0.0', configurable: true });

      expect(runDoctor(['--claude', '--json'])).toBe(3);
      const jsonOutput = log.mock.calls.at(-1)[0];
      const report = JSON.parse(jsonOutput);
      expect(report.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Node.js', level: 'ERROR' }),
      ]));
      expect(jsonOutput).not.toContain('诊断结果：');

      log.mockClear();
      expect(runDoctor(['--claude', '--json', '--verbose'])).toBe(3);
      const verboseJsonOutput = log.mock.calls.at(-1)[0];
      expect(() => JSON.parse(verboseJsonOutput)).not.toThrow();
      expect(verboseJsonOutput).not.toContain('详细检查：');
    } finally {
      Object.defineProperty(process, 'version', previousVersion);
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('returns structured JSON when a runtime root is a file instead of a directory', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-malformed-runtime-'));
    const previousCwd = process.cwd();
    fs.mkdirSync(path.join(projectRoot, '.claude', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.claude', 'skills'), 'blocked\n', 'utf8');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);
      expect(runDoctor(['--claude', '--json'])).toBe(3);
      const report = JSON.parse(log.mock.calls.at(-1)[0]);
      expect(report.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({
          level: 'ERROR',
          reasonCode: 'claude_runtime_inspection_failed',
        }),
      ]));
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('returns exit code 3 for an explicitly selected host CLI missing from PATH', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-cli-missing-'));
    const previousCwd = process.cwd();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    spawnSyncWithTimeout.mockImplementation((command) => command === 'claude'
      ? { status: -1, stdout: '', error: { code: 'ENOENT' } }
      : { status: 0, stdout: `${command} test-version\n` });

    try {
      process.chdir(projectRoot);
      expect(runDoctor(['--claude', '--json'])).toBe(3);
      const report = JSON.parse(log.mock.calls.at(-1)[0]);
      expect(report.platform_checks.claude).toEqual(expect.arrayContaining([
        expect.objectContaining({
          reasonCode: 'claude_cli_not_found',
          disposition: 'action_required',
        }),
      ]));
    } finally {
      process.chdir(previousCwd);
      spawnSyncWithTimeout.mockReset();
      spawnSyncWithTimeout.mockImplementation((command) => ({
        status: 0,
        stdout: `${command} test-version\n`,
      }));
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('keeps the no-host summary, verbose details, and JSON report explicit', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-no-host-'));
    const previousCwd = process.cwd();
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      process.chdir(projectRoot);

      expect(runDoctor([])).toBe(0);
      const defaultOutput = log.mock.calls.map(([line]) => line).join('\n');
      expect(defaultOutput).toContain('诊断结果：可用');
      expect(defaultOutput).toContain('宿主状态：');
      expect(defaultOutput).toContain('未检测到宿主。');
      expect(defaultOutput).toContain('spec-first init');

      log.mockClear();
      expect(runDoctor(['--verbose'])).toBe(0);
      const verboseOutput = log.mock.calls.map(([line]) => line).join('\n');
      expect(verboseOutput).toContain('详细检查：');
      expect(verboseOutput).toContain('未检测到宿主。');

      log.mockClear();
      expect(runDoctor(['--json'])).toBe(0);
      const jsonOutput = log.mock.calls.at(-1)[0];
      expect(JSON.parse(jsonOutput).platforms).toEqual([]);
      expect(jsonOutput).not.toContain('诊断结果：');
    } finally {
      process.chdir(previousCwd);
      log.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('returns usage error for unknown doctor arguments', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(runDoctor(['--unknown'])).toBe(2);
      expect(error).toHaveBeenCalledWith(expect.stringContaining('Usage: spec-first doctor'));
    } finally {
      error.mockRestore();
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

      expect(skillsRootCount).toBe(21);
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
