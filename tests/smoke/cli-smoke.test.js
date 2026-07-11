'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const sandboxRoots = new Set();

function tempSandbox(prefix) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const home = path.join(projectRoot, 'home');
  fs.mkdirSync(home, { recursive: true });
  sandboxRoots.add(projectRoot);
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: {
      ...process.env,
      HOME: sandbox.home,
      USERPROFILE: sandbox.home,
      HOMEDRIVE: path.parse(sandbox.home).root,
      HOMEPATH: sandbox.home.slice(path.parse(sandbox.home).root.length),
    },
    encoding: 'utf8',
    timeout: 30000,
  });
}

function runCommand(command, args, {
  cwd,
  home,
  timeout = 30000,
  env = {},
}) {
  const commandEnv = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    HOMEDRIVE: path.parse(home).root,
    HOMEPATH: home.slice(path.parse(home).root.length),
    ...env,
  };
  delete commandEnv.NPM_CONFIG_ALLOW_SCRIPTS;
  delete commandEnv.npm_config_allow_scripts;
  return spawnSync(command, args, {
    cwd,
    env: commandEnv,
    encoding: 'utf8',
    timeout,
  });
}

function runNpmCommand(args, options) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && fs.existsSync(npmExecPath)) {
    return runCommand(process.execPath, [npmExecPath, ...args], options);
  }
  if (process.platform === 'win32') {
    throw new Error('npm_execpath is required to run npm smoke commands on Windows');
  }
  return runCommand(npmCommand, args, options);
}

afterEach(() => {
  for (const projectRoot of sandboxRoots) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
  sandboxRoots.clear();
});

describe('CLI smoke checks', () => {
  test('prints top-level help', () => {
    const sandbox = tempSandbox('spec-first-smoke-help-');
    const result = runSpecFirst(['--help'], sandbox);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('📘 Usage:');
    expect(result.stdout).toContain('spec-first <command> [options]');
  });

  test('previews Qoder init without writing project or user runtime files', () => {
    const sandbox = tempSandbox('spec-first-smoke-qoder-');
    const result = runSpecFirst([
      'init',
      '--qoder',
      '--dry-run',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'zh',
    ], sandbox);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('spec-first init (qoder)');
    expect(result.stdout).toContain('不会修改文件');
    expect(result.stdout).toContain('AGENTS.md');
    expect(result.stdout).toContain('.gitignore');
    expect(result.stdout).toContain('CHANGELOG.md');
    expect(result.stdout).toContain('.qoder/spec-first/state.json');
    expect(result.stdout).toContain(path.join(sandbox.home, '.spec-first', '.developer'));
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'CHANGELOG.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.agents'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.spec-first', 'workspace'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.home, '.spec-first', '.developer'))).toBe(false);
  });

  test('writes and reports one global profile for a multi-host apply', () => {
    const sandbox = tempSandbox('spec-first-smoke-multi-host-');
    const result = runSpecFirst([
      'init',
      '--claude',
      '--codex',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'en',
    ], sandbox);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Init complete: 2/2 hosts ready');
    expect(result.stdout.match(/Global developer profile:/g) || []).toHaveLength(1);
    expect(result.stdout.match(/Claude Code:/g) || []).toHaveLength(1);
    expect(result.stdout.match(/Codex:/g) || []).toHaveLength(1);
    expect(result.stdout).not.toContain('0 agents');
    expect(result.stdout).not.toContain('No managed runtime paths require untracking');
    expect(fs.readFileSync(path.join(sandbox.home, '.spec-first', '.developer'), 'utf8'))
      .toContain('hosts=claude,codex\n');
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.claude'))).toBe(true);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.codex'))).toBe(true);
  });

  test('global profile failure stops before project bootstrap and preserves raw evidence', () => {
    const sandbox = tempSandbox('spec-first-smoke-blocked-home-');
    const blockedHome = path.join(sandbox.projectRoot, 'blocked-home');
    fs.rmSync(sandbox.home, { recursive: true, force: true });
    fs.writeFileSync(blockedHome, 'not a directory\n', 'utf8');
    sandbox.home = blockedHome;
    const resolvedGlobalPath = path.join(blockedHome, '.spec-first', '.developer');

    const result = runSpecFirst([
      'init',
      '--codex',
      '-y',
      '-u',
      'smoke-test',
      '--lang',
      'en',
    ], sandbox);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/ENOTDIR|EACCES|EPERM/);
    expect(result.stderr).toContain(resolvedGlobalPath);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.codex'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.agents'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.gitignore'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, 'CHANGELOG.md'))).toBe(false);
  });
  test('packed tarball initializes a coherent five-host runtime', () => {
    const sandbox = tempSandbox('spec-first-smoke-package-');
    const packRoot = path.join(sandbox.projectRoot, 'pack');
    const consumerRoot = path.join(sandbox.projectRoot, 'consumer');
    fs.mkdirSync(packRoot, { recursive: true });
    fs.mkdirSync(consumerRoot, { recursive: true });

    const pack = runNpmCommand([
      'pack',
      '--json',
      '--pack-destination',
      packRoot,
    ], {
      cwd: repoRoot,
      home: sandbox.home,
      timeout: 120000,
      env: isolatedNpmEnv(sandbox.home),
    });
    if (pack.status !== 0) {
      const errorMessage = pack.error ? pack.error.message : 'none';
      throw new Error([
        `npm pack failed (status=${pack.status}, signal=${pack.signal}, error=${errorMessage}):`,
        pack.stderr || pack.stdout,
      ].join('\n'));
    }
    const [{ filename }] = JSON.parse(pack.stdout);
    const tarballPath = path.join(packRoot, filename);
    expect(fs.existsSync(tarballPath)).toBe(true);

    const install = runNpmCommand([
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      tarballPath,
    ], {
      cwd: consumerRoot,
      home: sandbox.home,
      timeout: 120000,
      env: isolatedNpmEnv(sandbox.home),
    });
    if (install.status !== 0) {
      throw new Error(`packed tarball install failed:\n${install.stderr || install.stdout}`);
    }

    const packagedRoot = path.join(consumerRoot, 'node_modules', 'spec-first');
    const packagedCli = path.join(packagedRoot, 'bin', 'spec-first.js');
    const init = runCommand(process.execPath, [
      packagedCli,
      'init',
      '--claude',
      '--codex',
      '--cursor',
      '--kiro',
      '--qoder',
      '-y',
      '-u',
      'package-smoke',
      '--lang',
      'en',
      '--no-sync-user-language',
    ], {
      cwd: consumerRoot,
      home: sandbox.home,
      timeout: 120000,
    });
    expect(init.status).toBe(0);

    const runtimeRoots = {
      claude: '.claude/spec-first/workflows',
      codex: '.agents/skills',
      cursor: '.cursor/skills',
      kiro: '.kiro/skills',
      qoder: '.qoder/skills',
    };
    const requiredDoctorChecks = {
      claude: [
        '.claude/spec-first/state.json',
        'CLAUDE.md workflow entry guidance',
        '.claude/commands',
        '.claude/skills',
      ],
      codex: [
        '.codex/spec-first/state.json',
        'AGENTS.md workflow entry guidance',
        '.agents/skills',
      ],
      cursor: [
        '.cursor/spec-first/state.json',
        'AGENTS.md workflow entry guidance',
        '.cursor/skills',
      ],
      kiro: [
        '.kiro/spec-first/state.json',
        'AGENTS.md workflow entry guidance',
        '.kiro/skills',
      ],
      qoder: [
        '.qoder/spec-first/state.json',
        'AGENTS.md workflow entry guidance',
        '.qoder/commands',
        '.qoder/skills',
      ],
    };
    const registrySource = fs.readFileSync(
      path.join(packagedRoot, 'skills', 'spec-mcp-setup', 'setup-registry.json'),
      'utf8',
    );
    const setupSource = fs.readFileSync(
      path.join(packagedRoot, 'skills', 'spec-mcp-setup', 'scripts', 'setup.cjs'),
      'utf8',
    );

    for (const [platform, runtimeRoot] of Object.entries(runtimeRoots)) {
      const doctor = runCommand(process.execPath, [packagedCli, 'doctor', `--${platform}`, '--json'], {
        cwd: consumerRoot,
        home: sandbox.home,
        timeout: 120000,
      });
      expect(doctor.status).toBe(0);
      const doctorReport = JSON.parse(doctor.stdout);
      expect(doctorReport.install_health).toBe('pass');
      expect(doctorReport.checks.filter((check) => check.level === 'ERROR')).toEqual([]);
      expect(doctorReport.checks.filter((check) => check.drift === true)).toEqual([]);
      for (const checkName of requiredDoctorChecks[platform]) {
        expect(doctorReport.checks.find((check) => check.name === checkName)).toMatchObject({
          level: 'PASS',
        });
      }

      const setupRoot = path.join(consumerRoot, runtimeRoot, 'spec-mcp-setup');
      expect(fs.readFileSync(path.join(setupRoot, 'setup-registry.json'), 'utf8'))
        .toBe(registrySource);
      expect(fs.readFileSync(path.join(setupRoot, 'scripts', 'setup.cjs'), 'utf8'))
        .toBe(setupSource);
      expect(fs.existsSync(path.join(
        consumerRoot,
        runtimeRoot,
        'spec-prd',
        'evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        consumerRoot,
        runtimeRoot,
        'spec-app-consistency-audit',
        'README.md',
      ))).toBe(false);
    }

    const writeSkillCommand = fs.readFileSync(
      path.join(consumerRoot, '.claude', 'commands', 'spec-write-skill.md'),
      'utf8',
    );
    expect(writeSkillCommand).toContain('条件细节下沉 `references/` 并写清 context pointer');
    expect(writeSkillCommand).not.toContain(
      '`.claude/spec-first/workflows/spec-write-skill/references/`',
    );

    const crossHostReference = fs.readFileSync(path.join(
      consumerRoot,
      '.agents',
      'skills',
      'spec-compound',
      'references',
      'agents',
      'best-practices-researcher.md',
    ), 'utf8');
    expect(crossHostReference).toContain(
      '`.claude/skills/**/SKILL.md`, `.codex/skills/**/SKILL.md`, and `.agents/skills/**/SKILL.md`',
    );
  }, 120000);
});

function isolatedNpmEnv(home) {
  const userConfig = path.join(home, '.npmrc');
  const cache = path.join(home, '.npm-cache');
  return {
    NPM_CONFIG_USERCONFIG: userConfig,
    npm_config_userconfig: userConfig,
    NPM_CONFIG_CACHE: cache,
    npm_config_cache: cache,
  };
}
