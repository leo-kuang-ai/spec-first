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

describe('doctor Kiro auto-detection', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-doctor-kiro-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('does not treat Kiro-native specs as spec-first Kiro runtime', () => {
    fs.mkdirSync(path.join(tmp, '.kiro', 'specs', 'native'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.kiro', 'specs', 'native', 'spec.md'), '# native spec\n');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual([]);
    expect(payload.platform_checks).toEqual({});
    expect(payload.warnings.map((check) => check.name)).not.toContain('.kiro/skills');
    expect(payload.warnings.map((check) => check.name)).not.toContain('.kiro/agents');
    expect(payload.warnings.map((check) => check.name)).not.toContain('.kiro/spec-first/state.json');
  });

  test('detects Kiro when spec-first managed Kiro runtime exists', () => {
    fs.mkdirSync(path.join(tmp, '.kiro', 'spec-first'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.kiro', 'spec-first', 'state.json'), '{}\n');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual(['kiro']);
    expect(payload.platform_checks.kiro).toEqual(expect.any(Array));
  });

  test('reports Kiro-specific runtime drift warnings', () => {
    fs.mkdirSync(path.join(tmp, '.kiro', 'commands', 'spec'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.kiro', 'skills', 'bad-skill'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.kiro', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.kiro', 'skills', 'bad-skill', 'SKILL.md'), [
      '---',
      'name: wrong-name',
      'description: Bad fixture',
      '---',
      '',
      'Runtime reference: .agents/skills/spec-work/SKILL.md',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(tmp, '.kiro', 'agents', 'bad.agent.md'), [
      '---',
      'name: bad',
      'description: Bad fixture',
      'tools: ["Read", "Bash"]',
      'model: claude-opus',
      '---',
      '',
      'body',
      '',
    ].join('\n'));

    const result = captureDoctor(tmp, ['--kiro', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    const checks = payload.platform_checks.kiro;
    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'WARNING',
        name: '.kiro/commands/spec',
        message: expect.stringContaining('unexpected Kiro command runtime directory'),
      }),
      expect.objectContaining({
        level: 'WARNING',
        name: '.kiro/skills/bad-skill/SKILL.md',
        message: expect.stringContaining('name does not match folder'),
      }),
      expect.objectContaining({
        level: 'WARNING',
        name: '.kiro/agents/bad.agent.md',
        message: expect.stringContaining('tools must default to ["read"]'),
      }),
    ]));
    const commandRuntimeWarning = checks.find((check) => check.name === '.kiro/commands/spec');
    expect(commandRuntimeWarning.message).toContain('not generated command files');
    expect(commandRuntimeWarning.message).not.toContain('/spec commands');
    expect(checks.find((check) => check.name === '.kiro/skills/bad-skill/SKILL.md').message)
      .toContain('contains non-Kiro runtime path references');
    expect(checks.find((check) => check.name === '.kiro/agents/bad.agent.md').message)
      .toContain('model must be omitted by default');
    expect(checks.find((check) => check.name === '.kiro/agents/bad.agent.md').message)
      .toContain('leaks Claude/Codex tool names');
  });

  test('reports literal wildcard command mirrors that were not rewritten for Kiro runtime', () => {
    fs.mkdirSync(path.join(tmp, '.kiro', 'skills', 'spec-work'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.kiro', 'skills', 'spec-work', 'SKILL.md'), [
      '---',
      'name: spec-work',
      'description: Work fixture',
      '---',
      '',
      'Runtime denylist: .claude/commands/spec-*.md',
      'Runtime denylist: .qoder/commands/spec-*.md',
      '',
    ].join('\n'));

    const result = captureDoctor(tmp, ['--kiro', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    const check = payload.platform_checks.kiro.find((entry) =>
      entry.name === '.kiro/skills/spec-work/SKILL.md'
    );
    expect(check.message).toContain('contains non-Kiro runtime path references');
  });
});
