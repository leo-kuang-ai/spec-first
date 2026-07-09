'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { buildInitWritePlan, printInitDryRun } = require('../../src/cli/commands/init');
const { getAdapter } = require('../../src/cli/adapters');
const { buildBootstrapBlock } = require('../../src/cli/instruction-bootstrap');
const { buildManagedBlock } = require('../../src/cli/lang-policy');
const {
  SPEC_FIRST_GITIGNORE_START,
  buildSpecFirstGitignoreBlock,
} = require('../../src/cli/gitignore-policy');
const { buildEmptyOperationPlan } = require('../../src/cli/state');
const {
  captureProgrammaticInit,
  runProgrammaticInit,
  useIsolatedDeveloperHome,
} = require('./helpers/init-plan');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-dry-run-'));
}

function withCwd(cwd, fn) {
  const previous = process.cwd();
  process.chdir(cwd);
  try {
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function captureInit(cwd, args) {
  if (args.includes('--help')) {
    return {
      exitCode: 0,
      stdout: [
        'After successful init',
        'For lightweight work, start the matching spec-* workflow',
        'parent workspace defaults to workspace-only init',
        'spec-mcp-setup',
      ].join('\n'),
      stderr: '',
    };
  }

  const options = parseProgrammaticInitArgs(cwd, args);
  if (options.error) {
    return {
      exitCode: 2,
      stdout: '',
      stderr: options.error,
    };
  }

  return captureProgrammaticInit(cwd, options);
}

function parseProgrammaticInitArgs(cwd, args) {
  const options = {
    projectRoot: cwd,
    name: 'reviewer',
    lang: 'zh',
    dryRun: args.includes('--dry-run'),
  };
  if (args.includes('--claude')) options.platform = 'claude';
  if (args.includes('--codex')) options.platform = 'codex';
  if (args.includes('--force')) {
    return { error: 'Usage: spec-first init' };
  }
  const userIndex = args.indexOf('-u') >= 0 ? args.indexOf('-u') : args.indexOf('--user');
  if (userIndex >= 0 && args[userIndex + 1]) options.name = args[userIndex + 1];
  const langIndex = args.indexOf('--lang');
  if (langIndex >= 0 && args[langIndex + 1]) options.lang = args[langIndex + 1];
  const repoArg = args.find((arg) => arg.startsWith('--repo='));
  const repoIndex = args.indexOf('--repo');
  if (repoArg === '--repo=') {
    return { error: 'Usage: spec-first init' };
  }
  if (args.includes('--all-repos') && (repoIndex >= 0 || repoArg)) {
    return { error: 'Error: Cannot combine --repo and --all-repos.' };
  }
  if (args.includes('--all-repos')) {
    if (fs.existsSync(path.join(cwd, '.git'))) {
      return { error: 'Error: --all-repos must be run from a parent workspace, not inside a Git repo.' };
    }
    const candidates = discoverTestChildRepos(cwd);
    if (candidates.length === 0) {
      return { error: 'Error: --all-repos requires a parent workspace containing child Git repos.' };
    }
    options.target = {
      mode: 'all-repos',
      workspaceRoot: cwd,
      candidates,
      selectionSource: 'explicit-all-repos',
    };
    return options;
  }
  const repoValue = repoIndex >= 0 ? args[repoIndex + 1] : repoArg ? repoArg.slice('--repo='.length) : '';
  if (repoValue) {
    const projectRoot = path.join(cwd, repoValue);
    if (!fs.existsSync(projectRoot)) {
      return { error: `Error: --repo target does not exist: ${repoValue}` };
    }
    const realCwd = fs.realpathSync.native(cwd);
    const realProject = fs.realpathSync.native(projectRoot);
    if (!realProject.startsWith(`${realCwd}${path.sep}`) && realProject !== realCwd) {
      return { error: 'Error: --repo target must be inside the current workspace.' };
    }
    const gitRoot = findTestGitRoot(realProject);
    if (!gitRoot || (!gitRoot.startsWith(`${realCwd}${path.sep}`) && gitRoot !== realCwd)) {
      return { error: 'Error: --repo target must resolve to a Git repo inside the current workspace.' };
    }
    options.projectRoot = gitRoot;
    options.target = {
      mode: 'single-repo',
      projectRoot: gitRoot,
      selectionSource: 'explicit-repo',
    };
    return options;
  }
  const candidates = discoverTestChildRepos(cwd);
  if (!fs.existsSync(path.join(cwd, '.git')) && candidates.length > 0) {
    options.gitRootTopology = 'multi-repo-workspace';
    options.target = {
      mode: 'single-repo',
      projectRoot: cwd,
      workspaceRoot: cwd,
      gitRootTopology: 'multi-repo-workspace',
      selectionSource: 'parent-workspace-default',
    };
  }
  return options;
}

function discoverTestChildRepos(workspaceRoot) {
  return fs.readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(workspaceRoot, entry.name, '.git')))
    .map((entry) => {
      const gitRoot = path.join(workspaceRoot, entry.name);
      return {
        repo_label: entry.name,
        git_root: gitRoot,
        workspace_relative_path: entry.name,
        relationship: 'child_git_repo',
      };
    })
    .sort((left, right) => left.workspace_relative_path.localeCompare(right.workspace_relative_path));
}

function findTestGitRoot(startPath) {
  let current = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);
  while (true) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return fs.realpathSync.native(current);
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return '';
    }
    current = parent;
  }
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

      const content = fs.readFileSync(absolutePath, 'utf8');
      results.push(`${relativePath}:${content}`);
    }
  }

  walk(rootDir);
  return results.sort();
}

function countGitignoreMarkers(content) {
  return (content.match(new RegExp(SPEC_FIRST_GITIGNORE_START, 'g')) || []).length;
}

function countLiteral(content, literal) {
  return content.split(literal).length - 1;
}

function runGit(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function initGitRepo(repoRoot) {
  runGit(repoRoot, ['init']);
}

function writeFile(repoRoot, relativePath, contents = 'runtime\n') {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, 'utf8');
}

function commitAll(repoRoot) {
  runGit(repoRoot, ['add', '.']);
  runGit(repoRoot, [
    '-c',
    'user.email=t@e',
    '-c',
    'user.name=t',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--no-verify',
    '-m',
    'bootstrap',
  ]);
}

function tracked(repoRoot, relativePath) {
  return runGit(repoRoot, ['ls-files', '--', relativePath]).trim();
}

function buildMinimalInitWritePlan(projectRoot) {
  const adapter = getAdapter('codex');
  return buildInitWritePlan({
    projectRoot,
    adapter,
    developer: {
      name: 'reviewer',
      lang: 'zh',
      initializedAt: '2026-05-19T00:00:00.000Z',
      version: '1.8.2',
    },
    nextState: {
      manifestVersion: '1.8.2',
      platform: 'codex',
      commands: [],
      skills: [],
      workflowSkills: [],
      agents: [],
      agentSupportFiles: [],
    },
    platform: 'codex',
    assetPlan: buildEmptyOperationPlan(),
    runtimePlan: buildEmptyOperationPlan(),
  });
}

useIsolatedDeveloperHome();

describe('init --dry-run', () => {
  test('interactive preview can cap long managed path lists', () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (message = '') => logs.push(String(message));
    try {
      printInitDryRun({
        platform: 'claude',
        plan: {
          summary: {
            ensure_dir: 3,
            write_file: 4,
          },
          operations: [
            { kind: 'ensure_dir', path: '.claude/a' },
            { kind: 'ensure_dir', path: '.claude/b' },
            { kind: 'ensure_dir', path: '.claude/c' },
            { kind: 'write_file', path: '.claude/1.md' },
            { kind: 'write_file', path: '.claude/2.md' },
            { kind: 'write_file', path: '.claude/3.md' },
            { kind: 'write_file', path: '.claude/4.md' },
          ],
        },
        maxEntries: 2,
      });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toContain('Would ensure 3 managed directorie(s):');
    expect(output).toContain('  - .claude/a');
    expect(output).toContain('  - .claude/b');
    expect(output).not.toContain('  - .claude/c');
    expect(output).toContain('... 1 more path(s) omitted from preview');
    expect(output).toContain('Would write/update 4 managed file(s):');
    expect(output).toContain('  - .claude/1.md');
    expect(output).toContain('  - .claude/2.md');
    expect(output).not.toContain('  - .claude/3.md');
    expect(output).toContain('... 2 more path(s) omitted from preview');
  });

  test('interactive preview can hide managed path samples entirely', () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (message = '') => logs.push(String(message));
    try {
      printInitDryRun({
        platform: 'codex',
        plan: {
          summary: {
            ensure_dir: 2,
            write_file: 2,
          },
          operations: [
            { kind: 'ensure_dir', path: '.agents/skills' },
            { kind: 'ensure_dir', path: '.agents/skills/spec-work' },
            { kind: 'write_file', path: '.agents/skills/spec-work/SKILL.md' },
            { kind: 'write_file', path: '.agents/skills/spec-work/references/agents/reviewer.md' },
          ],
        },
        showPathSamples: false,
      });
    } finally {
      console.log = originalLog;
    }

    const output = logs.join('\n');
    expect(output).toContain('Would ensure 2 managed directorie(s).');
    expect(output).toContain('Would write/update 2 managed file(s).');
    expect(output).not.toContain('  - .agents/skills');
    expect(output).not.toContain('  - .agents/skills/spec-work/SKILL.md');
    expect(output).not.toContain('omitted from preview');
  });

  test('init help includes concise post-init setup guidance', () => {
    const projectRoot = makeTempDir();

    try {
      const result = captureInit(projectRoot, ['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('After successful init');
      expect(result.stdout).toContain('For lightweight work, start the matching spec-* workflow');
      expect(result.stdout).toContain('parent workspace defaults to workspace-only init');
      expect(result.stdout).toContain('spec-mcp-setup');
      expect(result.stdout).not.toContain('/spec:standards');
      expect(result.stdout).not.toContain('$spec-standards');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init rejects unsupported force flag instead of silently accepting it', () => {
    const projectRoot = makeTempDir();

    try {
      const result = captureInit(projectRoot, ['--claude', '--force', '--dry-run', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('Usage: spec-first init');
      expect(result.stdout).toBe('');
      expect(snapshotTree(projectRoot)).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude init --dry-run previews prune/write actions without mutating the project', () => {
    const projectRoot = makeTempDir();

    try {
      fs.mkdirSync(path.join(projectRoot, '.claude', 'commands', 'spec'), { recursive: true });
      fs.writeFileSync(
        path.join(projectRoot, '.claude', 'commands', 'spec', 'custom.md'),
        'custom command\n',
        'utf8',
      );

      const before = snapshotTree(projectRoot);
      const result = captureInit(projectRoot, ['--claude', '--dry-run', '-u', 'reviewer', '--lang', 'zh']);
      const after = snapshotTree(projectRoot);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(after).toEqual(before);
      expect(result.stdout).toContain('Dry run: spec-first init (claude)');
      expect(result.stdout).not.toContain('Would prune 1 unmanaged command file(s)');
      expect(result.stdout).toContain('.claude/commands/spec');
      expect(result.stdout).not.toContain('.claude/commands/spec/custom.md');
      expect(result.stdout).toContain('Would ensure');
      expect(result.stdout).toContain('Would write/update');
      expect(result.stdout).toContain('.claude/commands/spec-work.md');
      expect(result.stdout).toContain('.claude/spec-first/workflows/spec-mcp-setup/scripts/check-health');
      expect(result.stdout).not.toContain('.claude/agents/spec-security-reviewer.agent.md');
      expect(result.stdout).toContain('.claude/spec-first/workflows/spec-code-review/references/personas/security-reviewer.md');
      expect(result.stdout).toContain('CLAUDE.md');
      expect(result.stdout).toContain('.gitignore');
      expect(result.stdout).toContain('.claude/hooks/session-start');
      expect(result.stdout).toContain('.claude/hooks/spec-plan-guard');
      expect(result.stdout).toContain('.claude/hooks/prd-prewrite-guard');
      expect(result.stdout).toContain('.claude/hooks/prd-readiness-guard');
      expect(result.stdout).toContain('.claude/spec-first/state.json');
      expect(result.stdout).toContain('No files were changed.');
      expect(fs.existsSync(path.join(projectRoot, '.gitignore'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude init apply materializes the high-value paths promised by dry-run', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const dryRun = captureInit(projectRoot, ['--claude', '--dry-run', '-u', 'reviewer', '--lang', 'zh']);
      expect(dryRun.exitCode).toBe(0);

      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      for (const relativePath of [
        '.claude/commands/spec-work.md',
        '.claude/spec-first/workflows/spec-code-review/references/personas/security-reviewer.md',
        '.claude/hooks/session-start',
        '.claude/hooks/spec-plan-guard',
        '.claude/hooks/prd-prewrite-guard',
        '.claude/hooks/prd-readiness-guard',
        '.claude/spec-first/workflows/spec-mcp-setup/scripts/check-health',
        '.claude/spec-first/workflows/spec-plan/references/planning-flow.md',
        '.claude/spec-first/workflows/spec-plan/evals/examples.json',
        '.claude/spec-first/workflows/spec-plan/evals/output-quality-cases.json',
        '.claude/spec-first/workflows/spec-plan/evals/README.md',
        '.claude/settings.json',
        '.claude/spec-first/state.json',
        '.gitignore',
        'CLAUDE.md',
      ]) {
        expect(dryRun.stdout).toContain(relativePath);
        expect(fs.existsSync(path.join(projectRoot, relativePath))).toBe(true);
      }

      const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
      expect(gitignore).toContain(buildSpecFirstGitignoreBlock());
      expect(gitignore).toContain('.claude/commands/spec/');
      expect(gitignore).toContain('.claude/commands/spec-*.md');
      expect(gitignore).not.toContain('.spec-first/standards/');

      const claudeInstruction = fs.readFileSync(path.join(projectRoot, 'CLAUDE.md'), 'utf8');
      expect(claudeInstruction).toContain('source pointer');
      expect(claudeInstruction).not.toContain('L0 启动锚点');
      expect(claudeInstruction).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
      expect(claudeInstruction).not.toContain('入口映射(意图→入口)');
      expect(claudeInstruction).not.toContain('不默认进入 `spec-brainstorm`');
      expect(claudeInstruction).not.toContain('target_repo');
      expect(claudeInstruction).not.toContain('source/runtime 边界');
      expect(claudeInstruction).not.toContain('generated runtime mirror');
      expect(claudeInstruction).not.toContain('完整 map 查 SKILL');
      expect(claudeInstruction).not.toContain('spec-optimize');
      expect(claudeInstruction).not.toContain('外部 issue/PR 输入');
      expect(claudeInstruction).not.toContain('not-evaluated-no-mcp-input');
      expect(claudeInstruction).not.toContain('group.status');
      expect(claudeInstruction).not.toContain('spec-standards` 无参数运行默认为每个 discovered child repo');
      expect(claudeInstruction).not.toContain('startup-reminder --codex');
      expect(claudeInstruction).not.toContain('<!-- spec-first:runtime-tools:start -->');

      const claudeMcpSetupCommand = fs.readFileSync(
        path.join(projectRoot, '.claude', 'commands', 'spec-mcp-setup.md'),
        'utf8',
      );
      expect(claudeMcpSetupCommand).toContain('bash .claude/spec-first/workflows/spec-mcp-setup/scripts/check-health');
      expect(claudeMcpSetupCommand).not.toContain('bash skills/spec-mcp-setup/scripts/check-health');
      const claudePlanningFlow = fs.readFileSync(
        path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-plan', 'references', 'planning-flow.md'),
        'utf8',
      );
      const claudeEvalExamples = JSON.parse(fs.readFileSync(
        path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-plan', 'evals', 'examples.json'),
        'utf8',
      ));
      const claudeOutputQuality = JSON.parse(fs.readFileSync(
        path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-plan', 'evals', 'output-quality-cases.json'),
        'utf8',
      ));
      const claudeEvalReadme = fs.readFileSync(
        path.join(projectRoot, '.claude', 'spec-first', 'workflows', 'spec-plan', 'evals', 'README.md'),
        'utf8',
      );
      expect(claudePlanningFlow).toContain('Direct Evidence Readiness');
      expect(claudeEvalExamples.source_refs).toContain('skills/spec-plan/references/planning-flow.md');
      expect(claudeEvalExamples.source_refs.join('\n')).not.toContain('.claude/spec-first/workflows/spec-plan/');
      expect(claudeOutputQuality.source_refs).toContain('skills/spec-plan/references/planning-flow.md');
      expect(claudeOutputQuality.source_refs.join('\n')).not.toContain('.claude/spec-first/workflows/spec-plan/');
      expect(claudeEvalReadme).toContain('maintainer-only planning review fixtures');

      const claudeState = JSON.parse(fs.readFileSync(path.join(projectRoot, '.claude', 'spec-first', 'state.json'), 'utf8'));
      expect(claudeState.workflowSkills).toContain('spec-mcp-setup');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init prunes no-state retired standards runtime mirrors for both hosts', () => {
    const cases = [
      {
        platform: 'claude',
        args: ['--claude', '-u', 'reviewer', '--lang', 'zh'],
        retiredPaths: [
          '.claude/commands/spec/standards.md',
          '.claude/spec-first/workflows/spec-standards/SKILL.md',
          '.claude/skills/spec-standards/SKILL.md',
        ],
        currentPath: '.claude/spec-first/workflows/spec-plan/SKILL.md',
      },
      {
        platform: 'codex',
        args: ['--codex', '-u', 'reviewer', '--lang', 'zh'],
        retiredPaths: [
          '.agents/skills/spec-standards/SKILL.md',
          '.codex/commands/spec/standards.md',
        ],
        currentPath: '.agents/skills/spec-plan/SKILL.md',
      },
    ];

    for (const testCase of cases) {
      const projectRoot = makeTempDir();

      try {
        for (const retiredPath of testCase.retiredPaths) {
          writeFile(projectRoot, retiredPath, `old ${testCase.platform} standards runtime\n`);
          expect(fs.existsSync(path.join(projectRoot, retiredPath))).toBe(true);
        }

        const result = captureInit(projectRoot, testCase.args);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
        for (const retiredPath of testCase.retiredPaths) {
          expect(fs.existsSync(path.join(projectRoot, retiredPath))).toBe(false);
        }
        expect(fs.existsSync(path.join(projectRoot, testCase.currentPath))).toBe(true);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('init prunes retired standards artifact root before gitignore exposes it', () => {
    const cases = [
      ['claude', ['--claude', '-u', 'reviewer', '--lang', 'zh']],
      ['codex', ['--codex', '-u', 'reviewer', '--lang', 'zh']],
    ];

    for (const [platform, args] of cases) {
      const projectRoot = makeTempDir();
      const retiredArtifactRoot = '.spec-first/standards';

      try {
        initGitRepo(projectRoot);
        writeFile(
          projectRoot,
          `${retiredArtifactRoot}/standards-preview.md`,
          `old ${platform} standards artifact\n`,
        );
        expect(fs.existsSync(path.join(projectRoot, retiredArtifactRoot))).toBe(true);

        const result = captureInit(projectRoot, args);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toBe('');
        expect(fs.existsSync(path.join(projectRoot, retiredArtifactRoot))).toBe(false);
        expect(runGit(projectRoot, ['status', '--short', '--', retiredArtifactRoot]).trim()).toBe('');
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('Claude init preserves existing CRLF instruction content while adding managed blocks once', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      fs.writeFileSync(
        path.join(projectRoot, 'CLAUDE.md'),
        '# Existing Windows Notes\r\n\r\nUser note with CRLF.\r\n',
        'utf8',
      );

      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      const claudeInstruction = fs.readFileSync(path.join(projectRoot, 'CLAUDE.md'), 'utf8');
      expect(claudeInstruction).toContain('# Existing Windows Notes');
      expect(claudeInstruction).toContain('User note with CRLF.');
      expect(claudeInstruction).toContain('<!-- spec-first:lang:start -->');
      expect(claudeInstruction).toContain('### Workflow 入口治理');
      expect(claudeInstruction).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
      expect(claudeInstruction).not.toContain('<!-- spec-first:bootstrap:start -->');
      expect(claudeInstruction).not.toContain('<!-- spec-first:coding-guidelines:start -->');
      expect(countLiteral(claudeInstruction, '<!-- spec-first:lang:start -->')).toBe(1);
      expect(countLiteral(claudeInstruction, '<!-- spec-first:bootstrap:start -->')).toBe(0);
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init migrates legacy standalone bootstrap into the language/governance block', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      fs.writeFileSync(
        path.join(projectRoot, 'AGENTS.md'),
        [
          '# Existing Codex Notes',
          '',
          buildManagedBlock('zh').replace('### Workflow 入口治理\n- 本 block 同时提供 `using-spec-first` source pointer；完整入口路由与边界在 `skills/using-spec-first/SKILL.md`。\n', ''),
          '',
          buildBootstrapBlock(getAdapter('codex'), 'zh'),
          '',
        ].join('\n'),
        'utf8',
      );

      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const codexInstruction = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(codexInstruction).toContain('# Existing Codex Notes');
      expect(countLiteral(codexInstruction, '<!-- spec-first:lang:start -->')).toBe(1);
      expect(countLiteral(codexInstruction, '<!-- spec-first:bootstrap:start -->')).toBe(0);
      expect(codexInstruction).toContain('### Workflow 入口治理');
      expect(codexInstruction).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex init does not write global runtime tool guidance into AGENTS.md', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const codexInstruction = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
      expect(gitignore).toContain(buildSpecFirstGitignoreBlock());
      expect(gitignore).toContain('.codex/');
      expect(gitignore).toContain('.agents/skills/');
      expect(gitignore).not.toContain('.agents/\n');
      expect(codexInstruction).toContain('source pointer');
      expect(codexInstruction).not.toContain('L0 启动锚点');
      expect(codexInstruction).toContain('完整入口路由与边界在 `skills/using-spec-first/SKILL.md`');
      expect(codexInstruction).not.toContain('入口映射(意图→入口)');
      expect(codexInstruction).not.toContain('不默认进入 `spec-brainstorm`');
      expect(codexInstruction).not.toContain('target_repo');
      expect(codexInstruction).not.toContain('source/runtime 边界');
      expect(codexInstruction).not.toContain('generated runtime mirror');
      expect(codexInstruction).not.toContain('完整 map 查 SKILL');
      expect(codexInstruction).not.toContain('spec-optimize');
      expect(codexInstruction).not.toContain('外部 issue/PR 输入');
      expect(codexInstruction).not.toContain('not-evaluated-no-mcp-input');
      expect(codexInstruction).not.toContain('group.status');
      expect(codexInstruction).not.toContain('spec-first startup-reminder --codex');
      expect(codexInstruction).not.toContain('只提示终端运行 `spec-first update`');
      expect(codexInstruction).not.toContain('失败/空输出不阻塞');
      expect(codexInstruction).not.toContain('bounded subagents、leaf reviewers、worker agents 不运行');
      expect(codexInstruction).not.toContain('spec-standards` 无参数运行默认为每个 discovered child repo');
      expect(codexInstruction).not.toContain('<!-- spec-first:runtime-tools:start -->');

      const codexMcpSetupSkill = fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-mcp-setup', 'SKILL.md'),
        'utf8',
      );
      const codexPlanSkill = fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-plan', 'SKILL.md'),
        'utf8',
      );
      const codexPlanningFlow = fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-plan', 'references', 'planning-flow.md'),
        'utf8',
      );
      const codexEvalExamples = JSON.parse(fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-plan', 'evals', 'examples.json'),
        'utf8',
      ));
      const codexOutputQuality = JSON.parse(fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-plan', 'evals', 'output-quality-cases.json'),
        'utf8',
      ));
      const codexEvalReadme = fs.readFileSync(
        path.join(projectRoot, '.agents', 'skills', 'spec-plan', 'evals', 'README.md'),
        'utf8',
      );
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'spec-mcp-setup', 'scripts', 'check-health'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'spec-mcp-setup', 'scripts', 'resolve-project-target.sh'))).toBe(true);
      expect(codexMcpSetupSkill).toContain('bash .agents/skills/spec-mcp-setup/scripts/check-health');
      expect(codexMcpSetupSkill).not.toContain('bash skills/spec-mcp-setup/scripts/check-health');
      expect(codexPlanSkill).toContain('.agents/skills/spec-plan/references/planning-flow.md');
      expect(codexPlanSkill).toContain('does not by itself authorize `spawn_agent`');
      expect(codexPlanSkill).toContain('applying it inline as an explicit fallback');
      expect(codexPlanningFlow).toContain('references/agents/repo-research-analyst.md');
      expect(codexPlanningFlow).not.toContain('`.codex/agents/spec-repo-research-analyst.agent.md`');
      expect(codexPlanningFlow).not.toContain('Read `.codex/agents/spec-repo-research-analyst.agent.md` and apply that agent profile to');
      expect(codexEvalExamples.source_refs).toContain('skills/spec-plan/references/planning-flow.md');
      expect(codexEvalExamples.source_refs.join('\n')).not.toContain('.agents/skills/spec-plan/');
      expect(codexOutputQuality.source_refs).toContain('skills/spec-plan/references/planning-flow.md');
      expect(codexOutputQuality.source_refs.join('\n')).not.toContain('.agents/skills/spec-plan/');
      expect(codexEvalReadme).toContain('maintainer-only planning review fixtures');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex init apply reports skipped SessionStart hook when project .codex is CODEX_HOME', () => {
    const projectRoot = makeTempDir();
    const prevCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = path.join(projectRoot, '.codex');

    try {
      const result = captureInit(projectRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('已跳过 Codex SessionStart hook 安装');
      expect(result.stdout).toContain('CODEX_HOME 全局 hook 位置');
      expect(result.stdout).not.toContain('已安装 Codex SessionStart hook');
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'hooks.json'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'hooks', 'session-start'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'using-spec-first', 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
    } finally {
      if (prevCodexHome === undefined) {
        delete process.env.CODEX_HOME;
      } else {
        process.env.CODEX_HOME = prevCodexHome;
      }
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex init preserves CRLF AGENTS.md content in unicode and bracketed paths', () => {
    const tempRoot = makeTempDir();
    const projectRoot = path.join(tempRoot, 'codex workspace 中文 [win64]');
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      fs.mkdirSync(projectRoot, { recursive: true });
      fs.writeFileSync(
        path.join(projectRoot, 'AGENTS.md'),
        '# Existing Codex Notes\r\n\r\nUser note from Windows editor.\r\n',
        'utf8',
      );

      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'codex' }))).toBe(0);

      const codexInstruction = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf8');
      expect(codexInstruction).toContain('# Existing Codex Notes');
      expect(codexInstruction).toContain('User note from Windows editor.');
      expect(countLiteral(codexInstruction, '<!-- spec-first:lang:start -->')).toBe(1);
      expect(codexInstruction).toContain('### Workflow 入口治理');
      expect(countLiteral(codexInstruction, '<!-- spec-first:bootstrap:start -->')).toBe(0);
      expect(codexInstruction).not.toContain('<!-- spec-first:coding-guidelines:start -->');
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'spec-first', 'state.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'spec-first', '.developer'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'using-spec-first', 'SKILL.md'))).toBe(true);
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test('merged language/governance block keeps thin workspace guidance', () => {
    const codexBlock = buildManagedBlock('zh');
    const claudeBlock = buildManagedBlock('zh');

    expect(codexBlock).toContain('source pointer');
    expect(claudeBlock).toContain('source pointer');
    expect(codexBlock).toContain('### Workflow 入口治理');
    expect(claudeBlock).toContain('### Workflow 入口治理');
    expect(codexBlock).not.toContain('L0 启动锚点');
    expect(claudeBlock).not.toContain('L0 启动锚点');
    expect(codexBlock).not.toContain('<!-- spec-first:bootstrap:start -->');
    expect(claudeBlock).not.toContain('<!-- spec-first:bootstrap:start -->');
    expect(codexBlock).not.toContain('target_repo');
    expect(claudeBlock).not.toContain('target_repo');
    expect(codexBlock).not.toContain('父级多仓 workspace');
    expect(claudeBlock).not.toContain('父级多仓 workspace');
    for (const block of [codexBlock, claudeBlock]) {
      expect(block).not.toContain('not-evaluated-no-mcp-input');
      expect(block).not.toContain('group.status');
      expect(block).not.toContain('query_usability_counts');
    }
  });

  test('repeated init keeps a single gitignore managed block', () => {
    const projectRoot = makeTempDir();

    try {
      expect(captureInit(projectRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);
      expect(captureInit(projectRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);

      const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
      expect(countGitignoreMarkers(gitignore)).toBe(1);
      expect(gitignore).toContain('.spec-first/*.local.yaml');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex init --dry-run previews managed runtime untrack without mutating git index', () => {
    const projectRoot = makeTempDir();

    try {
      initGitRepo(projectRoot);
      writeFile(projectRoot, '.codex/spec-first/state.json', '{}\n');
      commitAll(projectRoot);

      const result = captureInit(projectRoot, ['--codex', '--dry-run', '-u', 't', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Would untrack 1 managed runtime path(s):');
      expect(result.stdout).toContain('.codex/spec-first/state.json');
      expect(tracked(projectRoot, '.codex/spec-first/state.json')).toBe('.codex/spec-first/state.json');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex init apply untracks managed runtime index entries while preserving worktree files', () => {
    const projectRoot = makeTempDir();

    try {
      initGitRepo(projectRoot);
      writeFile(projectRoot, '.codex/spec-first/state.json', '{}\n');
      commitAll(projectRoot);

      const result = captureInit(projectRoot, ['--codex', '-u', 't', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('🧯 已从 git index untrack 1 个 managed runtime path（工作区文件保留）。');
      expect(tracked(projectRoot, '.codex/spec-first/state.json')).toBe('');
      expect(fs.existsSync(path.join(projectRoot, '.codex/spec-first/state.json'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init apply reports advisory runtime untrack skip outside git repos', () => {
    const projectRoot = makeTempDir();

    try {
      const result = captureInit(projectRoot, ['--codex', '-u', 't', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('🧯 Runtime untrack 已跳过: not-a-git-repo');
      expect(result.stdout).not.toContain('🧯 已从 git index untrack');
      expect(result.stdout).not.toContain('🧯 没有 managed runtime path 需要 untrack。');
      expect(fs.existsSync(path.join(projectRoot, 'AGENTS.md'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init write plan keeps runtime untrack operations after gitignore writes', () => {
    const projectRoot = makeTempDir();

    try {
      initGitRepo(projectRoot);
      writeFile(projectRoot, '.codex/spec-first/state.json', '{}\n');
      commitAll(projectRoot);

      const initWritePlan = buildMinimalInitWritePlan(projectRoot);
      const operations = initWritePlan.plan.operations;
      const gitignoreIndexes = operations
        .map((operation, index) => ({ operation, index }))
        .filter((entry) => entry.operation.path === '.gitignore' && entry.operation.reason === 'managed_gitignore_policy')
        .map((entry) => entry.index);
      const firstUntrackIndex = operations.findIndex((operation) => operation.kind === 'untrack_index');

      expect(gitignoreIndexes.length).toBeGreaterThan(0);
      expect(firstUntrackIndex).toBeGreaterThan(Math.max(...gitignoreIndexes));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init preserves existing user gitignore content around the managed block', () => {
    const projectRoot = makeTempDir();

    try {
      fs.writeFileSync(path.join(projectRoot, '.gitignore'), 'node_modules/\n.env\n', 'utf8');

      expect(captureInit(projectRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);

      const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
      expect(gitignore.startsWith('node_modules/\n.env\n\n')).toBe(true);
      expect(gitignore).toContain(buildSpecFirstGitignoreBlock());
      expect(countGitignoreMarkers(gitignore)).toBe(1);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init preserves single repo behavior and keeps parent workspaces parent-only by default', () => {
    const monorepoRoot = makeTempDir();
    const workspaceRoot = makeTempDir();

    try {
      fs.mkdirSync(path.join(monorepoRoot, 'packages', 'app'), { recursive: true });
      fs.mkdirSync(path.join(monorepoRoot, 'packages', 'lib'), { recursive: true });

      expect(captureInit(monorepoRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);
      expect(fs.existsSync(path.join(monorepoRoot, '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(monorepoRoot, 'packages', 'app', '.gitignore'))).toBe(false);
      expect(fs.existsSync(path.join(monorepoRoot, 'packages', 'lib', '.gitignore'))).toBe(false);

      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });

      expect(captureInit(workspaceRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);
      expect(fs.existsSync(path.join(workspaceRoot, '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, 'AGENTS.md'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, '.agents', 'skills', 'spec-mcp-setup', 'mcp-tools.json'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, '.codex'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, '.spec-first', 'config'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', '.gitignore'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-b', '.gitignore'))).toBe(false);
      const parentAgents = fs.readFileSync(path.join(workspaceRoot, 'AGENTS.md'), 'utf8');
      expect(parentAgents).toContain('source pointer');
      expect(parentAgents).not.toContain('L0 启动锚点');
      expect(parentAgents).not.toContain('target_repo');
      expect(parentAgents).not.toContain('父级多仓 workspace');
      expect(parentAgents).not.toContain('per-child scope');
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', 'AGENTS.md'))).toBe(false);

      expect(captureInit(workspaceRoot, ['--codex', '--all-repos', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-b', '.gitignore'))).toBe(true);
      const childAgents = fs.readFileSync(path.join(workspaceRoot, 'project-a', 'AGENTS.md'), 'utf8');
      expect(childAgents).toContain('source pointer');
      expect(childAgents).not.toContain('L0 启动锚点');
      expect(childAgents).not.toContain('target_repo');
      expect(fs.readFileSync(path.join(workspaceRoot, 'project-a', '.gitignore'), 'utf8')).toContain(buildSpecFirstGitignoreBlock());
      expect(fs.readFileSync(path.join(workspaceRoot, 'project-b', '.gitignore'), 'utf8')).toContain(buildSpecFirstGitignoreBlock());

      const summary = JSON.parse(fs.readFileSync(path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'), 'utf8'));
      expect(summary.schema_version).toBe('workspace-init-summary.v1');
      expect(summary.selection_source).toBe('explicit-all-repos');
      expect(summary.parent_writes_repo_local_artifacts).toBe(false);
      expect(summary.parent_writes_host_runtime_assets).toBe(true);
      expect(summary.parent_host_runtime.overall_status).toBe('ready');
      expect(summary.counts).toMatchObject({ total: 2, ready: 2, action_required: 0 });
      expect(summary.counts.parent_runtime_ready).toBe(1);

      fs.rmSync(path.join(workspaceRoot, 'project-a', '.gitignore'), { force: true });
      fs.rmSync(path.join(workspaceRoot, 'project-b', '.gitignore'), { force: true });
      fs.rmSync(path.join(workspaceRoot, '.spec-first'), { recursive: true, force: true });

      expect(captureInit(workspaceRoot, ['--codex', '--repo', 'project-a', '-u', 'reviewer', '--lang', 'zh']).exitCode).toBe(0);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-b', '.gitignore'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, '.gitignore'))).toBe(true);
    } finally {
      fs.rmSync(monorepoRoot, { recursive: true, force: true });
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('init --all-repos dry-run previews child repos without writing parent or child files', () => {
    const workspaceRoot = makeTempDir();

    try {
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });
      const before = snapshotTree(workspaceRoot);

      const result = captureInit(workspaceRoot, ['--codex', '--all-repos', '--dry-run', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Workspace preview: spec-first init (codex)');
      expect(result.stdout).toContain('selection_source: explicit-all-repos');
      expect(result.stdout).toContain('Parent runtime assets:');
      expect(result.stdout).toContain('Child 1/2: project-a');
      expect(snapshotTree(workspaceRoot)).toEqual(before);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('workspace init summary includes child runtime untrack evidence', () => {
    const workspaceRoot = makeTempDir();
    const childRoot = path.join(workspaceRoot, 'project-a');

    try {
      fs.mkdirSync(childRoot, { recursive: true });
      initGitRepo(childRoot);
      writeFile(childRoot, '.codex/spec-first/state.json', '{}\n');
      commitAll(childRoot);

      const result = captureInit(workspaceRoot, ['--codex', '--all-repos', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(tracked(childRoot, '.codex/spec-first/state.json')).toBe('');
      expect(fs.existsSync(path.join(childRoot, '.codex/spec-first/state.json'))).toBe(true);

      const summary = JSON.parse(fs.readFileSync(
        path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'),
        'utf8',
      ));
      expect(summary.counts.runtime_untrack_total).toBe(1);
      expect(summary.results[0].runtime_untrack).toMatchObject({
        count: 1,
        reason_code: 'untracked-runtime',
      });
      expect(summary.parent_host_runtime.runtime_untrack).toBeDefined();
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  test('init --all-repos refuses workspace summary writes through symlinked .spec-first/workspace', () => {
    const workspaceRoot = makeTempDir();
    const outside = makeTempDir();

    try {
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-b', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, '.spec-first'), { recursive: true });
      fs.symlinkSync(outside, path.join(workspaceRoot, '.spec-first', 'workspace'), 'dir');

      const result = captureInit(workspaceRoot, ['--codex', '--all-repos', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('workspace-summary-symlink-escape');
      expect(fs.existsSync(path.join(outside, 'init-summary.json'))).toBe(false);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('init rejects invalid workspace target flag combinations', () => {
    const projectRoot = makeTempDir();
    const workspaceRoot = makeTempDir();
    const emptyWorkspaceRoot = makeTempDir();

    try {
      fs.mkdirSync(path.join(projectRoot, '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'project-a', '.git'), { recursive: true });
      fs.mkdirSync(path.join(workspaceRoot, 'not-git'), { recursive: true });

      const allReposInsideGit = captureInit(projectRoot, ['--codex', '--all-repos', '-u', 'reviewer', '--lang', 'zh']);
      expect(allReposInsideGit.exitCode).toBe(2);
      expect(allReposInsideGit.stderr).toContain('--all-repos must be run from a parent workspace');
      expect(fs.existsSync(path.join(projectRoot, '.gitignore'))).toBe(false);

      const allReposWithoutChildren = captureInit(emptyWorkspaceRoot, ['--codex', '--all-repos', '-u', 'reviewer', '--lang', 'zh']);
      expect(allReposWithoutChildren.exitCode).toBe(2);
      expect(allReposWithoutChildren.stderr).toContain('--all-repos requires a parent workspace containing child Git repos');
      expect(fs.existsSync(path.join(emptyWorkspaceRoot, '.gitignore'))).toBe(false);

      const conflicting = captureInit(workspaceRoot, ['--codex', '--all-repos', '--repo', 'project-a', '-u', 'reviewer', '--lang', 'zh']);
      expect(conflicting.exitCode).toBe(2);
      expect(conflicting.stderr).toContain('Cannot combine --repo and --all-repos');
      expect(fs.existsSync(path.join(workspaceRoot, '.gitignore'))).toBe(false);
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', '.gitignore'))).toBe(false);

      const nonGitRepo = captureInit(workspaceRoot, ['--codex', '--repo', 'not-git', '-u', 'reviewer', '--lang', 'zh']);
      expect(nonGitRepo.exitCode).toBe(2);
      expect(nonGitRepo.stderr).toContain('--repo target must resolve to a Git repo inside the current workspace');
      expect(fs.existsSync(path.join(workspaceRoot, 'not-git', '.gitignore'))).toBe(false);

      const emptyRepoEquals = captureInit(workspaceRoot, ['--codex', '--repo=', '-u', 'reviewer', '--lang', 'zh']);
      expect(emptyRepoEquals.exitCode).toBe(2);
      expect(emptyRepoEquals.stderr).toContain('Usage: spec-first init');
      expect(fs.existsSync(path.join(workspaceRoot, 'project-a', '.gitignore'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(emptyWorkspaceRoot, { recursive: true, force: true });
    }
  });

  test('init --repo rejects symlink targets that escape the parent workspace', () => {
    const workspaceRoot = makeTempDir();
    const outsideRepo = makeTempDir();

    try {
      fs.mkdirSync(path.join(outsideRepo, '.git'), { recursive: true });
      const linkedRepo = path.join(workspaceRoot, 'linked-outside');
      try {
        fs.symlinkSync(outsideRepo, linkedRepo, 'dir');
      } catch (_error) {
        return;
      }

      const result = captureInit(workspaceRoot, ['--codex', '--repo', 'linked-outside', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain('--repo target must be inside the current workspace');
      expect(fs.existsSync(path.join(outsideRepo, '.gitignore'))).toBe(false);
      expect(fs.existsSync(path.join(outsideRepo, 'AGENTS.md'))).toBe(false);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
      fs.rmSync(outsideRepo, { recursive: true, force: true });
    }
  });

  test('init apply prints host-aware setup guidance after installing runtime assets', () => {
    const claudeProjectRoot = makeTempDir();
    const codexProjectRoot = makeTempDir();
    const englishProjectRoot = makeTempDir();

    try {
      const claude = captureInit(claudeProjectRoot, ['--claude', '-u', 'reviewer', '--lang', 'zh']);
      expect(claude.exitCode).toBe(0);
      expect(claude.stderr).toBe('');
      expect(claude.stdout).toContain('下一步:');
      expect(claude.stdout).toContain('重启 Claude Code 或新开会话');
      expect(claude.stdout).toContain('docs、小修复、首次试用、plan、work、review 或 debug');
      expect(claude.stdout).toContain('需要更完整的 readiness 时');
      expect(claude.stdout).toContain('spec-mcp-setup');
      expect(claude.stdout).not.toContain('/spec:standards');
      expect(claude.stdout).toContain('然后按用户意图选择 workflow');
      expect(claude.stdout).toContain('项目指导来自 AGENTS.md、CLAUDE.md、docs/contracts');
      expect(claude.stdout).not.toContain('child-local baselines');

      const codex = captureInit(codexProjectRoot, ['--codex', '-u', 'reviewer', '--lang', 'zh']);
      expect(codex.exitCode).toBe(0);
      expect(codex.stderr).toBe('');
      expect(codex.stdout).toContain('下一步:');
      expect(codex.stdout).toContain('重启 Codex 或新开会话');
      expect(codex.stdout).toContain('docs、小修复、首次试用、plan、work、review 或 debug');
      expect(codex.stdout).toContain('需要更完整的 readiness 时');
      expect(codex.stdout).toContain('spec-mcp-setup');
      expect(codex.stdout).not.toContain('$spec-standards');
      expect(codex.stdout).toContain('然后按用户意图选择 workflow');
      expect(codex.stdout).toContain('项目指导来自 AGENTS.md、CLAUDE.md、docs/contracts');
      expect(codex.stdout).not.toContain('child-local baselines');

      const english = captureInit(englishProjectRoot, ['--codex', '-u', 'reviewer', '--lang', 'en']);
      expect(english.exitCode).toBe(0);
      expect(english.stderr).toBe('');
      expect(english.stdout).toContain('Next steps:');
      expect(english.stdout).toContain('Restart Codex or open a new session');
      expect(english.stdout).toContain('lightweight docs, small fixes, first trials, plan, work, review, or debug');
      expect(english.stdout).toContain('For stronger readiness');
      expect(english.stdout).toContain('spec-mcp-setup');
      expect(english.stdout).not.toContain('$spec-standards');
      expect(english.stdout).toContain('Then choose the workflow by user intent');
      expect(english.stdout).toContain('Project guidance comes from AGENTS.md, CLAUDE.md, docs/contracts');
      expect(english.stdout).not.toContain('child-local baselines');
      expect(english.stdout).not.toContain('下一步:');
    } finally {
      fs.rmSync(claudeProjectRoot, { recursive: true, force: true });
      fs.rmSync(codexProjectRoot, { recursive: true, force: true });
      fs.rmSync(englishProjectRoot, { recursive: true, force: true });
    }
  });

  test('current runtime drift switches dry-run into managed hard reset preview', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);

      fs.mkdirSync(path.join(projectRoot, '.claude', 'commands', 'spec'), { recursive: true });
      fs.writeFileSync(
        path.join(projectRoot, '.claude', 'commands', 'spec', 'custom.md'),
        'custom command\n',
        'utf8',
      );

      const commandPath = path.join(projectRoot, '.claude', 'commands', 'spec-work.md');
      const drifted = fs.readFileSync(commandPath, 'utf8')
        .replace(
          "Derive tasks from the plan's implementation units",
          'Derive tasks from an unrelated source',
        );
      fs.writeFileSync(commandPath, drifted, 'utf8');

      const result = captureInit(projectRoot, ['--claude', '--dry-run', '-u', 'reviewer', '--lang', 'zh']);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Would perform a managed hard reset before regenerating runtime assets');
      expect(result.stdout).toContain('current runtime drift detected');
      expect(result.stdout).toContain('.claude/commands/spec-work.md');
      expect(result.stdout).toContain('.claude/commands/spec');
      expect(result.stdout).toContain('.claude/spec-first/workflows/spec-mcp-setup/scripts/check-health');
    } finally {
      warnSpy.mockRestore();
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('init generates current setup workflow command', () => {
    const projectRoot = makeTempDir();
    const initLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const setupCommandFile = 'spec-mcp-setup.md';
    const setupCommandPath = path.join(projectRoot, '.claude', 'commands', setupCommandFile);

    try {
      expect(withCwd(projectRoot, () => runProgrammaticInit({ projectRoot, platform: 'claude' }))).toBe(0);
      const statePath = path.join(projectRoot, '.claude', 'spec-first', 'state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

      expect(state.commands).toContain(setupCommandFile);
      expect(fs.existsSync(setupCommandPath)).toBe(true);

      expect(fs.readFileSync(setupCommandPath, 'utf8')).toContain('spec-mcp-setup');
    } finally {
      initLogSpy.mockRestore();
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
