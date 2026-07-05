'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runDoctor } = require('../../src/cli/commands/doctor');
const { useIsolatedDeveloperHome } = require('./helpers/init-plan');

useIsolatedDeveloperHome();

function withCwd(cwd, fn) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function captureDoctor(cwd, args) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message = '') => logs.push(String(message));
  console.error = (message = '') => errors.push(String(message));
  try {
    const exitCode = withCwd(cwd, () => runDoctor(args));
    return {
      exitCode,
      stdout: logs.join('\n'),
      stderr: errors.join('\n'),
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
}

describe('doctor Qoder auto-detection', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-doctor-qoder-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('does not treat Qoder-native rules, settings, or hooks as spec-first Qoder runtime', () => {
    fs.mkdirSync(path.join(tmp, '.qoder', 'rules'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.qoder', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.qoder', 'rules', 'security.md'), '# native rule\n');
    fs.writeFileSync(path.join(tmp, '.qoder', 'settings.json'), '{"mcpServers":{}}\n');
    fs.writeFileSync(path.join(tmp, '.qoder', 'hooks', 'custom.json'), '{}\n');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual([]);
    expect(payload.platform_checks).toEqual({});
    const warningNames = payload.warnings.map((check) => check.name);
    expect(warningNames).not.toContain('.qoder/commands/spec');
    expect(warningNames).not.toContain('.qoder/skills');
    expect(warningNames).not.toContain('.qoder/agents');
    expect(warningNames).not.toContain('.qoder/spec-first/state.json');
  });

  test('does not auto-detect Qoder from user-owned command or skill directories without managed state', () => {
    fs.mkdirSync(path.join(tmp, '.qoder', 'commands'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.qoder', 'skills', 'custom-skill'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.qoder', 'commands', 'spec-custom.md'), [
      '---',
      'name: custom',
      'description: User command',
      '---',
      '',
      'User-owned Qoder command.',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(tmp, '.qoder', 'skills', 'custom-skill', 'SKILL.md'), [
      '---',
      'name: custom-skill',
      'description: User skill',
      '---',
      '',
      'User-owned Qoder skill.',
      '',
    ].join('\n'));

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual([]);
    expect(payload.platform_checks).toEqual({});
  });

  test('detects Qoder when spec-first managed Qoder runtime exists', () => {
    fs.mkdirSync(path.join(tmp, '.qoder', 'spec-first'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.qoder', 'spec-first', 'state.json'), '{}\n');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual(['qoder']);
    expect(payload.platform_checks.qoder).toEqual(expect.any(Array));
  });

  test('explicit doctor --qoder reports local MCP config without treating user settings as managed runtime', () => {
    fs.mkdirSync(path.join(tmp, '.qoder'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.qoder', 'settings.local.json'), '{"mcpServers":{"context7":{"command":"npx"}}}\n');
    fs.writeFileSync(path.join(tmp, '.qoder', 'settings.json'), '{"mcpServers":{"user-owned":{"command":"node"}}}\n');

    const result = captureDoctor(tmp, ['--qoder', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual(['qoder']);
    expect(payload.platform_checks.qoder).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'PASS',
        name: '.qoder/settings.local.json',
        message: 'found 1 local MCP server entry',
      }),
    ]));
    expect(payload.platform_checks.qoder.map((check) => check.name)).not.toContain('.qoder/settings.json');
  });

  test('reports Qoder-specific command, skill, and agent runtime drift warnings', () => {
    fs.mkdirSync(path.join(tmp, '.qoder', 'commands', 'spec'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.qoder', 'skills', 'bad-skill'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.qoder', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.qoder', 'commands', 'spec-work.md'), [
      '---',
      'name: spec-work',
      '---',
      '',
      'Runtime reference: .agents/skills/spec-work/SKILL.md',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(tmp, '.qoder', 'skills', 'bad-skill', 'SKILL.md'), [
      '---',
      'name: wrong-name',
      'description: Bad fixture',
      '---',
      '',
      'Runtime reference: .agents/skills/spec-work/SKILL.md',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(tmp, '.qoder', 'agents', 'bad.agent.md'), [
      '---',
      'name: bad',
      'description: Bad fixture',
      'tools: [Read, Bash]',
      'model: claude-opus',
      '---',
      '',
      'body',
      '',
    ].join('\n'));

    const result = captureDoctor(tmp, ['--qoder', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    const checks = payload.platform_checks.qoder;
    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'WARNING',
        name: '.qoder/commands/spec-work.md',
        message: expect.stringContaining('missing description'),
      }),
      expect.objectContaining({
        level: 'WARNING',
        name: '.qoder/skills/bad-skill/SKILL.md',
        message: expect.stringContaining('name does not match folder'),
      }),
      expect.objectContaining({
        level: 'WARNING',
        name: '.qoder/agents/bad.agent.md',
        message: expect.stringContaining('must not default to Bash'),
      }),
    ]));
    expect(checks.find((check) => check.name === '.qoder/commands/spec-work.md').message)
      .toContain('contains non-Qoder runtime path references');
    expect(checks.find((check) => check.name === '.qoder/skills/bad-skill/SKILL.md').message)
      .toContain('contains non-Qoder runtime path references');
    expect(checks.find((check) => check.name === '.qoder/agents/bad.agent.md').message)
      .toContain('model must be omitted by default');
  });
});
