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

function writeSkill(root, skillName, body = '') {
  const skillDir = path.join(root, skillName);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
    '---',
    `name: ${skillName}`,
    'description: Test skill',
    'disable-model-invocation: true',
    '---',
    '',
    body || 'body',
    '',
  ].join('\n'), 'utf8');
}

function writeState(root, stateFile, platform, workflowSkills) {
  const statePath = path.join(root, stateFile);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    manifestVersion: require('../../package.json').version,
    platform,
    commands: [],
    skills: [],
    workflowSkills,
    agents: [],
    agentSupportFiles: [],
  }, null, 2), 'utf8');
}

describe('doctor Cursor detection', () => {
  let tmp;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-doctor-cursor-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('does not treat Cursor-native rules or mcp config alone as spec-first Cursor runtime', () => {
    fs.mkdirSync(path.join(tmp, '.cursor', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.cursor', 'rules', 'product.mdc'), '# native rule\n', 'utf8');
    fs.writeFileSync(path.join(tmp, '.cursor', 'mcp.json'), '{"mcpServers":{}}\n', 'utf8');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual([]);
    expect(payload.platform_checks).toEqual({});
  });

  test('does not auto-detect Cursor runtime from user-owned Cursor skills alone', () => {
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'custom-skill');

    const result = captureDoctor(tmp, ['--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual([]);
    expect(payload.platform_checks).toEqual({});
  });

  test('explicit doctor --cursor reports generated-runtime preview and does not require agents', () => {
    fs.mkdirSync(path.join(tmp, '.cursor', 'spec-first'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'spec-work'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.cursor', 'spec-first', 'state.json'), JSON.stringify({
      manifestVersion: require('../../package.json').version,
      platform: 'cursor',
      commands: [],
      skills: [],
      workflowSkills: ['spec-work'],
      agents: [],
      agentSupportFiles: [],
    }, null, 2), 'utf8');
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-work');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platforms).toEqual(['cursor']);
    const checkNames = payload.platform_checks.cursor.map((check) => check.name);
    expect(checkNames).toContain('Cursor generated-runtime preview');
    expect(checkNames).toContain('.cursor/skills');
    expect(checkNames).not.toContain('.cursor/agents');
    expect(checkNames).not.toContain('.cursor/agents support assets');
  });

  test('reports Cursor project MCP config through redacted status only', () => {
    fs.mkdirSync(path.join(tmp, '.cursor', 'spec-first'), { recursive: true });
    fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'spec-work'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.cursor', 'spec-first', 'state.json'), JSON.stringify({
      manifestVersion: require('../../package.json').version,
      platform: 'cursor',
      commands: [],
      skills: [],
      workflowSkills: ['spec-work'],
      agents: [],
      agentSupportFiles: [],
    }, null, 2), 'utf8');
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-work');
    fs.writeFileSync(path.join(tmp, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: {
        context7: {
          type: 'stdio',
          command: 'npx',
          args: ['-y', '@upstash/context7-mcp@latest', '--token', 'literal-secret-token'],
          env: {
            API_KEY: 'literal-secret',
          },
        },
      },
    }, null, 2), 'utf8');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.platform_checks.cursor).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'PASS',
        name: '.cursor/mcp.json',
        message: 'found 1 project MCP server entry',
      }),
    ]));
    expect(result.stdout).not.toContain('literal-secret');
    expect(result.stdout).not.toContain('API_KEY');
    expect(result.stdout).not.toContain('@upstash/context7-mcp');
  });

  test('reports missing Cursor setup host pin in generated setup skill', () => {
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-mcp-setup', 'setup body without host pin');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    const check = payload.platform_checks.cursor.find((entry) =>
      entry.name === '.cursor/skills/spec-mcp-setup/SKILL.md'
    );
    expect(check).toEqual(expect.objectContaining({
      level: 'WARNING',
      message: expect.stringContaining('missing Cursor MCP_SETUP_HOST pin'),
    }));
  });

  test('reports literal wildcard command mirrors that were not rewritten for Cursor runtime', () => {
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-work', [
      'Runtime denylist: .claude/commands/spec-*.md',
      'Runtime denylist: .qoder/commands/spec-*.md',
    ].join('\n'));

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    const check = payload.platform_checks.cursor.find((entry) =>
      entry.name === '.cursor/skills/spec-work/SKILL.md'
    );
    expect(check.message).toContain('contains non-Cursor runtime path references');
  });

  test('reports unmanaged duplicate Cursor-compatible skill roots', () => {
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-plan', 'project skill');
    writeSkill(path.join(tmp, '.agents', 'skills'), 'spec-plan', 'compat skill');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload.platform_checks.cursor).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'WARNING',
        name: 'Cursor duplicate skill discovery: spec-plan',
        message: expect.stringContaining('.cursor/skills'),
      }),
    ]));
  });

  test('suppresses duplicate warning only for matching managed Cursor-compatible skill roots', () => {
    writeState(tmp, '.cursor/spec-first/state.json', 'cursor', ['spec-plan']);
    writeState(tmp, '.codex/spec-first/state.json', 'codex', ['spec-plan']);
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-plan', 'same body');
    writeSkill(path.join(tmp, '.agents', 'skills'), 'spec-plan', 'same body');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.platform_checks.cursor).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'Cursor duplicate skill discovery: spec-plan',
      }),
    ]));
  });

  test('reports managed duplicate Cursor-compatible skill roots when content diverges', () => {
    writeState(tmp, '.cursor/spec-first/state.json', 'cursor', ['spec-plan']);
    writeState(tmp, '.codex/spec-first/state.json', 'codex', ['spec-plan']);
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-plan', 'project managed body');
    writeSkill(path.join(tmp, '.agents', 'skills'), 'spec-plan', 'codex managed body');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.platform_checks.cursor).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'WARNING',
        name: 'Cursor duplicate skill discovery: spec-plan',
      }),
    ]));
  });

  test('reports unmanaged duplicate Cursor-compatible skill roots even when content matches', () => {
    writeSkill(path.join(tmp, '.cursor', 'skills'), 'spec-plan', 'same body');
    writeSkill(path.join(tmp, '.agents', 'skills'), 'spec-plan', 'same body');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.platform_checks.cursor).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'WARNING',
        name: 'Cursor duplicate skill discovery: spec-plan',
      }),
    ]));
  });

  test('reports stale Cursor skill frontmatter and path rewrites', () => {
    fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'bad-skill'), { recursive: true });
    fs.writeFileSync(path.join(tmp, '.cursor', 'skills', 'bad-skill', 'SKILL.md'), [
      '---',
      'name: wrong-name',
      'argument-hint: [bad]',
      '---',
      '',
      'Runtime reference: .qoder/commands/spec-work.md',
      '',
    ].join('\n'), 'utf8');

    const result = captureDoctor(tmp, ['--cursor', '--json']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    const check = payload.platform_checks.cursor.find((entry) =>
      entry.name === '.cursor/skills/bad-skill/SKILL.md'
    );
    expect(check).toEqual(expect.objectContaining({
      level: 'WARNING',
      message: expect.stringContaining('name does not match folder'),
    }));
    expect(check.message).toContain('missing description');
    expect(check.message).toContain('contains non-Cursor frontmatter fields');
    expect(check.message).toContain('contains non-Cursor runtime path references');
  });
});
