'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { printInitDryRun, runInit } = require('../../src/cli/commands/init');
const { BrandColors } = require('../../src/cli/brand');
const { buildUserLanguageBlock } = require('../../src/cli/lang-policy');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-interactive-'));
}

// 现有用例隐式依赖真实 ~/.spec-first/.developer,会让 init 走"沿用确认"分支并污染机器全局 profile。
// 仓库 jest 环境下 os.homedir() 无视 process.env.HOME,改用 spy 把 HOME 钉到隔离临时目录,
// 使「无全局 profile」成为默认基线,各用例按需写入。
let isolatedHome = null;
let homedirSpy = null;

beforeEach(() => {
  isolatedHome = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-home-'));
  homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(isolatedHome);
});

afterEach(() => {
  if (homedirSpy) {
    homedirSpy.mockRestore();
    homedirSpy = null;
  }
  if (isolatedHome) {
    fs.rmSync(isolatedHome, { recursive: true, force: true });
    isolatedHome = null;
  }
});

function writeGlobalDeveloperProfile({
  name = 'leokuang',
  lang = 'zh',
  hosts = null,
  syncUserLanguage = null,
} = {}) {
  const dir = path.join(isolatedHome, '.spec-first');
  fs.mkdirSync(dir, { recursive: true });
  const hostsLine = Array.isArray(hosts) && hosts.length > 0 ? `hosts=${hosts.join(',')}\n` : '';
  const syncLine = typeof syncUserLanguage === 'boolean'
    ? `sync_user_language=${syncUserLanguage ? 'true' : 'false'}\n`
    : '';
  fs.writeFileSync(
    path.join(dir, '.developer'),
    `name=${name}\nlang=${lang}\ninitialized_at=2026-06-04T00:00:00.000Z\nversion=test\n${hostsLine}${syncLine}`,
    'utf8',
  );
}

function readGlobalDeveloperProfile() {
  const filePath = path.join(isolatedHome, '.spec-first', '.developer');
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

async function withCwd(cwd, fn) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return await fn();
  } finally {
    process.chdir(previous);
  }
}

async function captureInit(cwd, args, promptOverrides = {}) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message = '') => logs.push(String(message));
  console.error = (message = '') => errors.push(String(message));
  try {
    const exitCode = await withCwd(cwd, () => runInit(args, promptOverrides));
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

function isReusePrompt(question) {
  const text = String(question || '');
  return text.includes('沿用') || text.includes('Reuse');
}

function isUserLanguageSyncPrompt(question) {
  const text = String(question || '');
  return text.includes('用户级语言偏好') || text.includes('user-level language preference');
}

function interactivePrompts({
  platforms = ['codex'],
  name = 'reviewer',
  lang = 'zh',
  confirmed = true,
  reuseGlobalProfile = true,
  syncUserLanguage = false,
  workspaceTarget = null,
} = {}) {
  return {
    requireTty: () => ({ ok: true, reason: null }),
    checkbox: jest.fn(() => Promise.resolve(platforms)),
    select: jest.fn((question, options) => {
      if (options.some((option) => option.value === 'zh' || option.value === 'en')) return Promise.resolve(lang);
      if (options.some((option) => option.value === null || (option.value && option.value.mode))) {
        if (workspaceTarget === 'single') return Promise.resolve(options[1].value);
        if (workspaceTarget === 'cancel') return Promise.resolve(null);
        return Promise.resolve(options[0].value);
      }
      return Promise.resolve(options[0].value);
    }),
    textInput: jest.fn(() => Promise.resolve(name)),
    // confirm 承载沿用 profile、用户级语言同步 consent 与应用更改,按 question 文本分流。
    confirm: jest.fn((question) => Promise.resolve(
      isReusePrompt(question)
        ? reuseGlobalProfile
        : (isUserLanguageSyncPrompt(question) ? syncUserLanguage : confirmed),
    )),
  };
}

function snapshotTree(rootDir) {
  const results = [];
  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, absolutePath);
      if (entry.isDirectory()) {
        results.push(`${relativePath}/`);
        walk(absolutePath);
        continue;
      }
      results.push(`${relativePath}:${fs.readFileSync(absolutePath, 'utf8')}`);
    }
  }
  walk(rootDir);
  return results.sort();
}

describe('interactive init command', () => {
  test('help describes interactive init plus Trellis-style host shortcuts', async () => {
    const projectRoot = makeTempDir();

    try {
      const result = await captureInit(projectRoot, ['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('spec-first init');
      expect(result.stdout).toContain('Interactive steps');
      expect(result.stdout).toContain('Select one or more host runtimes');
      expect(result.stdout).toContain('spec-first init --codex');
      expect(result.stdout).toContain('spec-first init -y');
      expect(result.stdout).toContain('Explicit --claude/--codex/--kiro/--qoder flags override the default host set.');
      expect(result.stdout).toContain('--dry-run');
      expect(result.stdout).toContain('--sync-user-language');
      expect(result.stdout).toContain('--no-sync-user-language');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('unsupported init flags are rejected before prompting', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts();

    try {
      const result = await captureInit(projectRoot, ['--bogus'], prompts);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('unknown option --bogus');
      expect(result.stderr).toContain('Usage: spec-first init');
      expect(prompts.checkbox).not.toHaveBeenCalled();
      expect(snapshotTree(projectRoot)).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('conflicting user-language sync flags are rejected before prompting', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts();

    try {
      const result = await captureInit(projectRoot, ['--sync-user-language', '--no-sync-user-language'], prompts);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Cannot combine --sync-user-language and --no-sync-user-language');
      expect(result.stderr).toContain('Usage: spec-first init');
      expect(prompts.checkbox).not.toHaveBeenCalled();
      expect(snapshotTree(projectRoot)).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('non-TTY init exits 2 without prompting or writing files', async () => {
    const projectRoot = makeTempDir();
    const prompts = {
      ...interactivePrompts(),
      requireTty: () => ({ ok: false, reason: 'no-stdin-tty' }),
    };

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('requires an interactive terminal');
      expect(prompts.select).not.toHaveBeenCalled();
      expect(snapshotTree(projectRoot)).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('confirmed Codex init writes runtime assets through interactive answers', async () => {
    const projectRoot = makeTempDir();

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], interactivePrompts({ platforms: ['codex'] }));

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Spec-First v');
      expect(result.stdout).toContain('spec-first init (codex)');
      expect(result.stdout).toContain('已在 .agents/skills 生成');
      expect(result.stdout).toContain('重启');
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'spec-work', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'spec-first', '.developer'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('interactive host checkbox starts with no checked hosts', async () => {
    const projectRoot = makeTempDir();
    let hostChoices = [];
    const prompts = interactivePrompts({ platforms: ['codex'], confirmed: false });
    prompts.checkbox = jest.fn((_question, options) => {
      hostChoices = options;
      return Promise.resolve(['codex']);
    });

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(0);
      expect(hostChoices).toHaveLength(4);
      expect(hostChoices.map((choice) => choice.value)).toEqual(['claude', 'codex', 'kiro', 'qoder']);
      expect(hostChoices.every((choice) => choice.checked === false)).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('interactive host checkbox pre-checks the remembered selection', async () => {
    const projectRoot = makeTempDir();
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude'] });
    let hostChoices = [];
    const prompts = interactivePrompts({ platforms: ['claude'], confirmed: false });
    prompts.checkbox = jest.fn((_question, options) => {
      hostChoices = options;
      return Promise.resolve(['claude']);
    });

    try {
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      const checkedById = Object.fromEntries(hostChoices.map((choice) => [choice.value, choice.checked]));
      expect(checkedById.claude).toBe(true);
      expect(checkedById.codex).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('remembered unsupported host ids are ignored when pre-checking', async () => {
    const projectRoot = makeTempDir();
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude', 'jetbrains'] });
    let hostChoices = [];
    const prompts = interactivePrompts({ platforms: ['claude'], confirmed: false });
    prompts.checkbox = jest.fn((_question, options) => {
      hostChoices = options;
      return Promise.resolve(['claude']);
    });

    try {
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      expect(hostChoices).toHaveLength(4);
      const checkedById = Object.fromEntries(hostChoices.map((choice) => [choice.value, choice.checked]));
      expect(checkedById.claude).toBe(true);
      expect(checkedById.kiro).toBe(false);
      expect(checkedById.qoder).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('interactive install persists the selected hosts to the global profile', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts({ platforms: ['claude'], confirmed: true });

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh', '--user', 'reviewer'], prompts);

      expect(result.exitCode).toBe(0);
      expect(readGlobalDeveloperProfile()).toContain('hosts=claude');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('host selection change persists even when name and lang are unchanged', async () => {
    const projectRoot = makeTempDir();
    // 既有全局 profile:name/lang 不变,上次只选 claude。这是最常见的重装路径。
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude'] });
    const prompts = interactivePrompts({ platforms: ['claude', 'codex'], confirmed: true });

    try {
      // 纯交互(无 --user/--lang),走"沿用全局 profile"分支,name/lang 不变。
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      expect(readGlobalDeveloperProfile()).toContain('hosts=claude,codex');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('explicit host flag skips only the host checkbox', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts({ platforms: ['claude'] });

    try {
      const result = await captureInit(projectRoot, ['--codex'], prompts);

      expect(result.exitCode).toBe(0);
      expect(prompts.checkbox).not.toHaveBeenCalled();
      expect(prompts.textInput).toHaveBeenCalled();
      expect(result.stdout).toContain('spec-first init (codex)');
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('-y initializes default host runtimes without prompts', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts();
    prompts.requireTty = jest.fn(() => ({ ok: false, reason: 'no-stdin-tty' }));

    try {
      const result = await captureInit(projectRoot, ['-y', '-u', 'reviewer', '--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(0);
      expect(prompts.requireTty).not.toHaveBeenCalled();
      expect(prompts.checkbox).not.toHaveBeenCalled();
      expect(prompts.textInput).not.toHaveBeenCalled();
      expect(prompts.confirm).not.toHaveBeenCalled();
      expect(result.stdout).not.toContain('Spec-First v');
      expect(result.stdout).not.toContain('spec-first v');
      expect(fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('explicit host flag with -y initializes only that runtime', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts();
    prompts.requireTty = jest.fn(() => ({ ok: false, reason: 'no-stdin-tty' }));

    try {
      const result = await captureInit(projectRoot, ['--codex', '-y', '-u', 'reviewer', '--lang=zh'], prompts);

      expect(result.exitCode).toBe(0);
      expect(prompts.requireTty).not.toHaveBeenCalled();
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'CLAUDE.md'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('--sync-user-language with -y writes selected Codex user instructions and persists consent', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;
    const prompts = interactivePrompts();
    prompts.requireTty = jest.fn(() => ({ ok: false, reason: 'no-stdin-tty' }));

    try {
      const result = await captureInit(projectRoot, [
        '--codex',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'zh',
        '--sync-user-language',
      ], prompts);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('User-level language sync');
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8')).toContain('<!-- spec-first:user-language:start -->');
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=true');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('--no-sync-user-language with -y removes all supported host user-language blocks and persists opt-out', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;
    fs.writeFileSync(path.join(codexHome, 'AGENTS.md'), `codex before\n${buildUserLanguageBlock('zh')}\ncodex after\n`, 'utf8');
    fs.mkdirSync(path.join(isolatedHome, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(isolatedHome, '.claude', 'CLAUDE.md'), `claude before\n${buildUserLanguageBlock('zh')}\nclaude after\n`, 'utf8');

    try {
      const result = await captureInit(projectRoot, [
        '--codex',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'zh',
        '--no-sync-user-language',
      ]);

      expect(result.exitCode).toBe(0);
      const codexUser = fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8');
      const claudeUser = fs.readFileSync(path.join(isolatedHome, '.claude', 'CLAUDE.md'), 'utf8');
      expect(codexUser).toContain('codex before');
      expect(codexUser).not.toContain('spec-first:user-language:start');
      expect(claudeUser).toContain('claude after');
      expect(claudeUser).not.toContain('spec-first:user-language:start');
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=false');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('user-language dry-run previews global writes without mutating user files or profile', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      const result = await captureInit(projectRoot, [
        '--codex',
        '--dry-run',
        '-u',
        'reviewer',
        '--lang',
        'zh',
        '--sync-user-language',
      ], interactivePrompts());

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('User-level language sync');
      expect(result.stdout).toContain('Dry run: 不会写入用户级 instruction 文件或全局 developer profile。');
      expect(fs.existsSync(path.join(codexHome, 'AGENTS.md'))).toBe(false);
      expect(readGlobalDeveloperProfile()).toBe('');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('interactive user-language consent yes persists true after final apply', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      const result = await captureInit(projectRoot, ['--codex', '--lang', 'zh'], interactivePrompts({
        platforms: ['codex'],
        syncUserLanguage: true,
      }));

      expect(result.exitCode).toBe(0);
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8')).toContain('语言规则为绝对硬执行要求');
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=true');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('interactive user-language consent no persists false only after final apply', async () => {
    const projectRoot = makeTempDir();

    try {
      const result = await captureInit(projectRoot, ['--codex', '--lang', 'zh'], interactivePrompts({
        platforms: ['codex'],
        syncUserLanguage: false,
        confirmed: true,
      }));

      expect(result.exitCode).toBe(0);
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=false');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('cancel after declining user-language consent leaves the consent unset', async () => {
    const projectRoot = makeTempDir();

    try {
      const result = await captureInit(projectRoot, ['--codex', '--lang', 'zh'], interactivePrompts({
        platforms: ['codex'],
        syncUserLanguage: false,
        confirmed: false,
      }));

      expect(result.exitCode).toBe(0);
      expect(readGlobalDeveloperProfile()).toBe('');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('cancel at confirm leaves disk unchanged', async () => {
    const projectRoot = makeTempDir();
    const before = snapshotTree(projectRoot);

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], interactivePrompts({ confirmed: false }));

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('已取消');
      expect(snapshotTree(projectRoot)).toEqual(before);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('first interactive run prints full art before prompts', async () => {
    const projectRoot = makeTempDir();

    try {
      const result = await captureInit(projectRoot, [], interactivePrompts({ confirmed: false }));

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Spec-First v');
      expect(result.stdout).toContain('███████╗');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('existing managed state prints only the lightweight wordmark', async () => {
    const projectRoot = makeTempDir();
    fs.mkdirSync(path.join(projectRoot, '.claude', 'spec-first'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.claude', 'spec-first', 'state.json'), '{}\n', 'utf8');

    try {
      const result = await captureInit(projectRoot, [], interactivePrompts({ confirmed: false }));

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('spec-first v');
      expect(result.stdout).not.toContain('███████╗');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('existing managed state is detected from a repo subdirectory', async () => {
    const projectRoot = makeTempDir();
    const subdir = path.join(projectRoot, 'packages', 'tooling');
    fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
    fs.mkdirSync(path.join(projectRoot, '.codex', 'spec-first'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, '.codex', 'spec-first', 'state.json'), '{}\n', 'utf8');
    fs.mkdirSync(subdir, { recursive: true });

    try {
      const result = await captureInit(subdir, [], interactivePrompts({ confirmed: false }));

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('spec-first v');
      expect(result.stdout).not.toContain('███████╗');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('non-TTY rejection does not print a banner', async () => {
    const projectRoot = makeTempDir();
    const prompts = {
      ...interactivePrompts(),
      requireTty: () => ({ ok: false, reason: 'no-stdin-tty' }),
    };

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).not.toContain('Spec-First v');
      expect(result.stdout).not.toContain('spec-first v');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('explicit --lang en localizes interactive prompts and next steps', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts({ platforms: ['codex'], confirmed: true });

    try {
      const result = await captureInit(projectRoot, ['--codex', '--lang', 'en'], prompts);

      expect(result.exitCode).toBe(0);
      expect(prompts.textInput.mock.calls[0][0]).toContain('Developer name');
      expect(prompts.confirm.mock.calls.some((call) => call[0].includes('Apply these changes'))).toBe(true);
      expect(result.stdout).toContain('Dry run: spec-first init (codex)');
      expect(result.stdout).toContain('Restart Codex');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('interactive language choice localizes later workspace prompts and cancellation', async () => {
    const workspaceRoot = makeTempDir();
    const childA = path.join(workspaceRoot, 'child-a');
    const prompts = interactivePrompts({
      lang: 'en',
      workspaceTarget: 'cancel',
    });

    try {
      fs.mkdirSync(path.join(childA, '.git'), { recursive: true });

      const result = await captureInit(workspaceRoot, [], prompts);
      const workspaceCall = prompts.select.mock.calls.find((call) => (
        call[1].some((option) => option.value === null || (option.value && option.value.mode))
      ));

      expect(result.exitCode).toBe(0);
      expect(prompts.checkbox.mock.calls[0][0]).toContain('Select host runtimes');
      expect(prompts.checkbox.mock.calls[0][2].hint).toContain('Space toggle');
      expect(prompts.textInput.mock.calls[0][0]).toContain('Developer name');
      expect(workspaceCall[0]).toContain('Select workspace target');
      expect(workspaceCall[2].hint).toContain('Enter confirm');
      expect(result.stdout).toContain('Cancelled.');
      expect(result.stdout).not.toContain('已取消');
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('host checkbox receives hint and min-selection feedback options', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts({ platforms: ['codex'], confirmed: false });

    try {
      const result = await captureInit(projectRoot, ['--lang', 'zh'], prompts);
      const checkboxOptions = prompts.checkbox.mock.calls[0][2];

      expect(result.exitCode).toBe(0);
      expect(checkboxOptions.hint).toContain('空格');
      expect(checkboxOptions.onMinError(1)).toContain('1');
      expect(checkboxOptions.onMinError(1)).toContain('至少');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('preview dry-run messages localize and color semantic counts', () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (message = '') => logs.push(String(message));
    try {
      printInitDryRun({
        platform: 'codex',
        lang: 'zh',
        useColor: true,
        plan: {
          summary: {
            remove_file: 1,
            write_file: 2,
          },
          operations: [],
        },
        untrackDiagnostic: {
          reason_code: 'untracked-runtime',
          count: 1,
          sample_paths: ['.codex/spec-first/.developer'],
        },
        showPathSamples: false,
      });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toContain('预览: spec-first init (codex)');
    expect(output).toContain('移除');
    expect(output).toContain(`${BrandColors.remove}1${BrandColors.reset}`);
    expect(output).toContain(`${BrandColors.write}2${BrandColors.reset}`);
    expect(output).toContain(`${BrandColors.untrack}1${BrandColors.reset}`);
  });

  test('preview dry-run can render English without ANSI codes', () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (message = '') => logs.push(String(message));
    try {
      printInitDryRun({
        platform: 'claude',
        lang: 'en',
        useColor: false,
        plan: {
          summary: {
            remove_file: 1,
            write_file: 1,
          },
          operations: [],
        },
        showPathSamples: false,
      });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toContain('Would remove 1 managed obsolete path(s).');
    expect(output).toContain('Would write/update 1 managed file(s).');
    expect(output).not.toMatch(/\x1B\[[0-?]*[ -/]*[@-~]/);
  });

  test('parent workspace can initialize all discovered child repos', async () => {
    const workspaceRoot = makeTempDir();
    const childA = path.join(workspaceRoot, 'child-a');
    const childB = path.join(workspaceRoot, 'child-b');

    try {
      fs.mkdirSync(path.join(childA, '.git'), { recursive: true });
      fs.mkdirSync(path.join(childB, '.git'), { recursive: true });

      const result = await captureInit(workspaceRoot, [], interactivePrompts({ platforms: ['claude'] }));

      expect(result.exitCode).toBe(0);
      expect(fs.existsSync(path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(childA, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(childB, 'CLAUDE.md'))).toBe(true);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('all-repos workspace init persists the selected hosts to the global profile', async () => {
    const workspaceRoot = makeTempDir();
    const childA = path.join(workspaceRoot, 'child-a');
    const childB = path.join(workspaceRoot, 'child-b');

    try {
      fs.mkdirSync(path.join(childA, '.git'), { recursive: true });
      fs.mkdirSync(path.join(childB, '.git'), { recursive: true });

      const result = await captureInit(workspaceRoot, [], interactivePrompts({ platforms: ['claude'] }));

      expect(result.exitCode).toBe(0);
      // 回归:workspace 路径必须把所选 host 持久化(此前 platforms 未透传导致 hosts 丢失)。
      expect(readGlobalDeveloperProfile()).toContain('hosts=claude');
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('all-repos applies user-language sync once and records it in the workspace summary', async () => {
    const workspaceRoot = makeTempDir();
    const childA = path.join(workspaceRoot, 'child-a');
    const childB = path.join(workspaceRoot, 'child-b');
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;

    try {
      fs.mkdirSync(path.join(childA, '.git'), { recursive: true });
      fs.mkdirSync(path.join(childB, '.git'), { recursive: true });

      const result = await captureInit(workspaceRoot, [
        '--codex',
        '--all-repos',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'zh',
        '--sync-user-language',
      ]);

      expect(result.exitCode).toBe(0);
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8')).toContain('spec-first:user-language:start');
      expect(fs.readdirSync(codexHome).filter((entry) => entry === 'AGENTS.md')).toHaveLength(1);
      const summary = JSON.parse(fs.readFileSync(path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary-codex.json'), 'utf8'));
      expect(summary.user_language_sync.status).toBe('ready');
      expect(summary.user_language_sync.operations).toHaveLength(1);
      expect(summary.user_language_sync.operations[0].host).toBe('codex');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('-y install persists the default host runtimes to the global profile', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts();
    prompts.requireTty = jest.fn(() => ({ ok: false, reason: 'no-stdin-tty' }));

    try {
      const result = await captureInit(projectRoot, ['-y', '-u', 'reviewer', '--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(0);
      // AE5:--yes 路径持久化 defaultForYes(claude+codex),不经过多选框。
      expect(readGlobalDeveloperProfile()).toMatch(/hosts=claude,codex/);
      expect(readGlobalDeveloperProfile()).not.toContain('sync_user_language=');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('stored true silently syncs the selected user-language host', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['codex'], syncUserLanguage: true });

    try {
      const result = await captureInit(projectRoot, ['--codex', '-y']);

      expect(result.exitCode).toBe(0);
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8')).toContain('spec-first:user-language:start');
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=true');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('stored false retries residual all-host cleanup without recreating missing user files', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['codex'], syncUserLanguage: false });
    fs.writeFileSync(path.join(codexHome, 'AGENTS.md'), `before\n${buildUserLanguageBlock('zh')}\nafter\n`, 'utf8');

    try {
      const result = await captureInit(projectRoot, ['--codex', '-y']);

      expect(result.exitCode).toBe(0);
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.md'), 'utf8')).not.toContain('spec-first:user-language:start');
      expect(fs.existsSync(path.join(isolatedHome, '.claude'))).toBe(false);
      expect(readGlobalDeveloperProfile()).toContain('sync_user_language=false');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('Codex override shadowing returns non-zero after project init without persisting consent', async () => {
    const projectRoot = makeTempDir();
    const codexHome = makeTempDir();
    const previousCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = codexHome;
    fs.writeFileSync(path.join(codexHome, 'AGENTS.override.md'), 'manual override\n', 'utf8');

    try {
      const result = await captureInit(projectRoot, [
        '--codex',
        '-y',
        '-u',
        'reviewer',
        '--lang',
        'zh',
        '--sync-user-language',
      ]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('codex-global-override-active');
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(codexHome, 'AGENTS.md'))).toBe(false);
      expect(fs.readFileSync(path.join(codexHome, 'AGENTS.override.md'), 'utf8')).toBe('manual override\n');
      expect(readGlobalDeveloperProfile()).not.toContain('sync_user_language=true');
    } finally {
      if (previousCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = previousCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(codexHome, { recursive: true, force: true });
    }
  });

  test('an empty host selection does not erase a previously remembered selection', async () => {
    const projectRoot = makeTempDir();
    // 既有记录 hosts=claude,codex;dry-run 不应抹掉(本次未表达 host 选择)。
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude', 'codex'] });
    const { buildInitPlan, applyInitPlan } = require('../../src/cli/commands/init');

    try {
      const plan = buildInitPlan({
        platform: 'claude',
        name: 'leokuang',
        lang: 'zh',
        target: { mode: 'single-repo', projectRoot },
      });
      applyInitPlan(projectRoot, plan);

      // 即使本次未传 platforms(空选择),既有 hosts 记录仍被保留。
      expect(readGlobalDeveloperProfile()).toMatch(/hosts=claude,codex/);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('explicit host flag persists the selected host to the global profile', async () => {
    const projectRoot = makeTempDir();
    // 既有记录 hosts=claude;显式 --codex 应把记录更新为 codex。
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude'] });
    const prompts = interactivePrompts({ platforms: ['claude'] });

    try {
      const result = await captureInit(projectRoot, ['--codex', '--user', 'leokuang', '--lang', 'zh'], prompts);

      expect(result.exitCode).toBe(0);
      expect(prompts.checkbox).not.toHaveBeenCalled();
      expect(readGlobalDeveloperProfile()).toMatch(/hosts=codex/);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('explicit identity overwrite preserves the original initialized_at', () => {
    const { buildInitPlan } = require('../../src/cli/commands/init');
    const projectRoot = makeTempDir();
    const dir = path.join(isolatedHome, '.spec-first');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, '.developer'),
      'name=old\nlang=zh\ninitialized_at=2026-01-01T00:00:00.000Z\nversion=1.0.0\nhosts=claude\n',
      'utf8',
    );

    try {
      // 显式改名/改语言走 overwrite 分支;initialized_at 是首次初始化时间,不应被刷新。
      const plan = buildInitPlan({
        platform: 'codex',
        platforms: ['codex'],
        user: 'newname',
        lang: 'en',
        target: { mode: 'single-repo', projectRoot },
      });
      expect(plan.globalDeveloperWrite.action).toBe('overwrite');
      expect(plan.globalDeveloperWrite.developer.initializedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(plan.globalDeveloperWrite.developer.name).toBe('newname');
      expect(plan.globalDeveloperWrite.developer.hosts).toEqual(['codex']);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('reordered identical host selection is treated as unchanged (no spurious overwrite)', () => {
    const { buildInitPlan } = require('../../src/cli/commands/init');
    const projectRoot = makeTempDir();
    // 既有记录 hosts=claude,codex(文件读回为排序后形式)。
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh', hosts: ['claude', 'codex'] });

    try {
      // 本次选择顺序相反但集合相同;不传 name/lang 走非显式分支,
      // sameHosts 应判定无变化 -> preserve(不因顺序差异触发覆写)。
      const plan = buildInitPlan({
        platform: 'claude',
        platforms: ['codex', 'claude'],
        target: { mode: 'single-repo', projectRoot },
      });
      expect(plan.globalDeveloperWrite.action).toBe('preserve');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('existing global profile reuses name and lang without re-prompting', async () => {
    const projectRoot = makeTempDir();
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh' });
    const prompts = interactivePrompts({ platforms: ['codex'], reuseGlobalProfile: true });

    try {
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      // 沿用确认弹出,但不再追问名字或语言。
      expect(prompts.confirm.mock.calls.some((call) => isReusePrompt(call[0]))).toBe(true);
      expect(prompts.textInput).not.toHaveBeenCalled();
      expect(prompts.select).not.toHaveBeenCalled();
      // 不弹覆盖确认,全局 profile 保持原值。
      expect(prompts.confirm.mock.calls.some((call) => String(call[0]).includes('覆盖'))).toBe(false);
      expect(readGlobalDeveloperProfile()).toContain('name=leokuang');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('declining reuse re-prompts for language and developer name', async () => {
    const projectRoot = makeTempDir();
    writeGlobalDeveloperProfile({ name: 'leokuang', lang: 'zh' });
    const prompts = interactivePrompts({
      platforms: ['codex'],
      reuseGlobalProfile: false,
      name: 'newname',
      lang: 'zh',
      confirmed: true,
    });

    try {
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      // 选 No 后补回语言选择与名字输入。
      expect(prompts.select).toHaveBeenCalled();
      expect(prompts.textInput).toHaveBeenCalled();
      // 改名后弹覆盖确认并写入新值。
      expect(prompts.confirm.mock.calls.some((call) => String(call[0]).includes('覆盖'))).toBe(true);
      expect(readGlobalDeveloperProfile()).toContain('name=newname');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('no global profile keeps the original name input flow', async () => {
    const projectRoot = makeTempDir();
    const prompts = interactivePrompts({ platforms: ['codex'], name: 'reviewer', lang: 'zh' });

    try {
      const result = await captureInit(projectRoot, [], prompts);

      expect(result.exitCode).toBe(0);
      // 无全局 profile:不弹沿用确认,直接走语言选择与名字输入框。
      expect(prompts.confirm.mock.calls.some((call) => isReusePrompt(call[0]))).toBe(false);
      expect(prompts.select).toHaveBeenCalled();
      expect(prompts.textInput).toHaveBeenCalled();
      expect(readGlobalDeveloperProfile()).toContain('name=reviewer');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
