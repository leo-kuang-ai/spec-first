'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const sandboxRoots = new Set();

afterEach(() => {
  for (const root of sandboxRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  sandboxRoots.clear();
});

function tempSandbox(platform) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${platform}-lifecycle-`));
  sandboxRoots.add(root);
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: { ...process.env, HOME: sandbox.home },
    encoding: 'utf8',
    timeout: 120000,
  });
}

function parseJsonOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`failed to parse JSON output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
}

function findGeneratedPathLeaks(root, needles) {
  const hits = [];
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
        continue;
      }
      const contents = fs.readFileSync(absolutePath);
      for (const needle of needles) {
        if (contents.includes(Buffer.from(needle))) {
          hits.push({ path: path.relative(root, absolutePath), needle });
        }
      }
    }
  }
  return hits;
}

const pointerPlatforms = getSupportedPlatforms().filter((platform) =>
  Boolean(getAdapter(platform).pointerPath)
);

describe('six-host init lifecycle', () => {
  test.each(getSupportedPlatforms())(
    '%s fresh init is self-consistent and immediately idempotent',
    (platform) => {
      const sandbox = tempSandbox(platform);
      const adapter = getAdapter(platform);
      const initArgs = [
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ];

      const firstInit = runSpecFirst(initArgs, sandbox);
      expect(firstInit.status).toBe(0);

      for (const unselectedPlatform of getSupportedPlatforms().filter((entry) => entry !== platform)) {
        expect(fs.existsSync(path.join(
          sandbox.projectRoot,
          getAdapter(unselectedPlatform).stateFile,
        ))).toBe(false);
      }

      const instruction = fs.readFileSync(
        path.join(sandbox.projectRoot, adapter.instructionFile),
        'utf8',
      );
      expect(instruction).toContain('`using-spec-first`');
      expect(instruction).not.toContain('skills/using-spec-first/SKILL.md');
      expect(instruction).not.toContain('CHANGELOG.md');
      expect(instruction).not.toContain('### Changelog');

      const runtimeSkillPath = path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'using-spec-first',
        'SKILL.md',
      );
      expect(fs.existsSync(runtimeSkillPath)).toBe(true);
      const portableHookFiles = {
        claude: ['.claude/settings.json', '.claude/hooks/session-start'],
        codex: [
          '.codex/hooks.json',
          '.codex/hooks/session-start',
          '.codex/hooks/session-start.cmd',
        ],
        qoder: ['.qoder/hooks/session-start'],
      }[platform] || [];
      for (const relativePath of portableHookFiles) {
        const contents = fs.readFileSync(path.join(sandbox.projectRoot, relativePath), 'utf8');
        expect(contents).not.toContain(sandbox.projectRoot);
        expect(contents).not.toContain(repoRoot);
        expect(contents).not.toContain(process.execPath);
        expect(contents).not.toContain('__SPEC_FIRST_CLI_PATH__');
        expect(contents).not.toContain('__CODEX_SESSION_START_NODE__');
      }
      expect(findGeneratedPathLeaks(sandbox.projectRoot, [
        sandbox.projectRoot,
        sandbox.home,
        repoRoot,
        process.execPath,
      ])).toEqual([]);
      for (const relativePath of [
        'SKILL.md',
        'references/pipeline-orchestration.md',
        'scripts/agent-browser-run-context.cjs',
      ]) {
        expect(fs.existsSync(path.join(
          sandbox.projectRoot,
          adapter.skillsRoot,
          'spec-test-browser',
          relativePath,
        ))).toBe(true);
      }
      const runtimeSetupExecutor = path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-runtime-setup',
        'scripts',
        'lib',
        'installation-executor.cjs',
      );
      expect(fs.existsSync(runtimeSetupExecutor)).toBe(true);
      const runtimeSetupSkill = fs.readFileSync(path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-runtime-setup',
        'SKILL.md',
      ), 'utf8');
      expect(runtimeSetupSkill).toContain('### Readiness Handoff');
      expect(runtimeSetupSkill).toContain('请基于当前项目处理这个任务：<描述你的需求或问题>。');
      expect(runtimeSetupSkill).toContain('Please handle this task based on the current project: <describe your requirement or problem>.');
      const { resolveAgentBrowserProbePath } = require(runtimeSetupExecutor);
      expect(resolveAgentBrowserProbePath()).toBe(fs.realpathSync.native(path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'spec-test-browser',
        'scripts',
        'agent-browser-run-context.cjs',
      )));
      expect(fs.existsSync(resolveAgentBrowserProbePath())).toBe(true);
      for (const relativePath of [
        'references/browser-runtime-profile.schema.json',
        'references/browser-runtime-profile.example.json',
        'scripts/dev-server-run-context.cjs',
      ]) {
        expect(fs.existsSync(path.join(
          sandbox.projectRoot,
          adapter.skillsRoot,
          'spec-test-browser',
          relativePath,
        ))).toBe(false);
      }
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'spec-test-browser',
        'evals',
      ))).toBe(false);
      for (const [helperName, relativePaths, userInvocable, descriptionPattern] of [
        ['spec-commit', ['SKILL.md'], false, /description:.*Internal/i],
        ['spec-commit-push-pr', [
          'SKILL.md',
          'references/branch-creation.md',
          'references/pr-description-writing.md',
        ], false, /description:.*Internal/i],
      ]) {
        for (const relativePath of relativePaths) {
          const helperPath = path.join(
            sandbox.projectRoot,
            adapter.skillsRoot,
            helperName,
            relativePath,
          );
          expect(fs.existsSync(helperPath)).toBe(true);
          if (relativePath === 'SKILL.md') {
            const helperSource = fs.readFileSync(helperPath, 'utf8');
            expect(helperSource).toMatch(descriptionPattern);
            if (userInvocable === false && platform !== 'cursor') {
              expect(helperSource).toMatch(/^user-invocable:\s*false$/m);
            }
            if (platform === 'cursor') {
              expect(helperSource).toMatch(/^disable-model-invocation:\s*true$/m);
            }
          }
        }
      }
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'spec-proof',
      ))).toBe(false);
      for (const [standaloneName, relativePaths] of [
        ['spec-resolve-pr-feedback', [
          'SKILL.md',
          'references/full-mode.md',
          'references/targeted-mode.md',
          'references/agents/pr-comment-resolver.md',
          'scripts/get-pr-comments',
          'scripts/reply-to-pr-thread',
          'scripts/resolve-pr-thread',
        ]],
        ['spec-test-xcode', ['SKILL.md']],
      ]) {
        for (const relativePath of relativePaths) {
          expect(fs.existsSync(path.join(
            sandbox.projectRoot,
            adapter.skillsRoot,
            standaloneName,
            relativePath,
          ))).toBe(true);
        }
      }
      const changelog = fs.readFileSync(
        path.join(sandbox.projectRoot, 'CHANGELOG.md'),
        'utf8',
      );
      expect(changelog).toContain('使用 spec-first 初始化项目');

      if (adapter.pointerPath) {
        const pointer = fs.readFileSync(
          path.join(sandbox.projectRoot, adapter.pointerPath),
          'utf8',
        );
        expect(pointer).toContain(`${adapter.skillsRoot}/using-spec-first/SKILL.md`);
        expect(pointer).not.toContain('Workflow entry routing lives in `skills/using-spec-first/SKILL.md`.');
      }

      if (platform === 'qoder') {
        expect(firstInit.stderr).toContain('qoder_hook_activation_unverified');
        expect(firstInit.stderr).toContain('qodercli 1.0.41 evidence baseline confirms the hook settings and command protocol');
        expect(firstInit.stderr).toContain('inactive');
      }

      const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
      expect(doctor.status).toBe(0);
      const report = parseJsonOutput(doctor);
      const instructionCheck = report.checks.find((check) =>
        check.name === `${adapter.instructionFile} workflow entry guidance`
      );
      expect(instructionCheck).toMatchObject({ level: 'PASS' });
      expect(report.checks.filter((check) => check.drift === true)).toEqual([]);
      if (platform === 'qoder') {
        const degradedHookChecks = report.checks.filter((check) =>
          check.reasonCode === 'qoder_hook_activation_unverified'
        );
        expect(degradedHookChecks).toHaveLength(3);
        expect(degradedHookChecks).toEqual(expect.arrayContaining([
          expect.objectContaining({
            level: 'WARNING',
            degradedByDesign: true,
            drift: false,
          }),
        ]));
      }

      const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
      expect(secondInit.status).toBe(0);
      const secondOutput = `${secondInit.stdout}\n${secondInit.stderr}`;
      expect(secondInit.stdout).toContain('Preview coverage:');
      expect(secondInit.stdout).toContain('Target detail:');
      expect(secondInit.stdout).toContain('Preview omitted:');
      expect(secondOutput).not.toContain('current_runtime_drift');
      expect(secondOutput).not.toContain('managed hard reset before regenerating runtime assets (current runtime drift detected)');
    },
    120000,
  );

  test.each(getSupportedPlatforms())(
    '%s preserves an existing CHANGELOG byte-for-byte',
    (platform) => {
      const sandbox = tempSandbox(`${platform}-changelog`);
      const changelogPath = path.join(sandbox.projectRoot, 'CHANGELOG.md');
      const sentinel = '# User-owned changelog\n\n- keep this byte-for-byte\n';
      fs.writeFileSync(changelogPath, sentinel);

      const init = runSpecFirst([
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ], sandbox);

      expect(init.status).toBe(0);
      expect(fs.readFileSync(changelogPath, 'utf8')).toBe(sentinel);
    },
    120000,
  );

  test.each(getSupportedPlatforms())(
    '%s clean removes exact managed assets and preserves custom siblings',
    (platform) => {
      const sandbox = tempSandbox(`${platform}-clean-ownership`);
      const adapter = getAdapter(platform);
      const initArgs = [
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ];
      const init = runSpecFirst(initArgs, sandbox);
      expect(init.status).toBe(0);

      const customSkill = path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'spec-company-skill',
        'SKILL.md',
      );
      fs.mkdirSync(path.dirname(customSkill), { recursive: true });
      fs.writeFileSync(customSkill, 'team-owned skill\n');

      const customPaths = [customSkill];
      if (adapter.hasCommands) {
        const customCommand = path.join(
          sandbox.projectRoot,
          adapter.commandRoot,
          'spec-company-command.md',
        );
        fs.mkdirSync(path.dirname(customCommand), { recursive: true });
        fs.writeFileSync(customCommand, 'team-owned command\n');
        customPaths.push(customCommand);
      }
      const retiredCommandRoot = {
        claude: '.claude/commands/spec',
        qoder: '.qoder/commands/spec',
        opencode: '.opencode/commands/spec',
      }[platform];
      if (retiredCommandRoot) {
        const legacyNamespaceSibling = path.join(
          sandbox.projectRoot,
          retiredCommandRoot,
          'company.md',
        );
        fs.mkdirSync(path.dirname(legacyNamespaceSibling), { recursive: true });
        fs.writeFileSync(legacyNamespaceSibling, 'team-owned legacy namespace command\n');
        customPaths.push(legacyNamespaceSibling);
      }
      if (adapter.supportsAgents !== false) {
        const customAgent = path.join(
          sandbox.projectRoot,
          adapter.agentsRoot,
          'spec-company-agent.md',
        );
        fs.mkdirSync(path.dirname(customAgent), { recursive: true });
        fs.writeFileSync(customAgent, 'team-owned agent\n');
        customPaths.push(customAgent);
      }
      if (adapter.workflowsRoot !== adapter.skillsRoot) {
        const customWorkflow = path.join(
          sandbox.projectRoot,
          adapter.workflowsRoot,
          'spec-company-workflow',
          'SKILL.md',
        );
        fs.mkdirSync(path.dirname(customWorkflow), { recursive: true });
        fs.writeFileSync(customWorkflow, 'team-owned workflow\n');
        customPaths.push(customWorkflow);
      }
      const customContents = new Map(customPaths.map((customPath) => [
        customPath,
        fs.readFileSync(customPath),
      ]));

      fs.appendFileSync(path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'using-spec-first',
        'SKILL.md',
      ), '\nmanaged drift\n');
      const repaired = runSpecFirst(initArgs, sandbox);
      expect(repaired.status).toBe(0);
      expect(`${repaired.stdout}\n${repaired.stderr}`).toContain('current spec-first runtime drift');
      for (const customPath of customPaths) {
        expect(fs.readFileSync(customPath)).toEqual(customContents.get(customPath));
      }

      const clean = runSpecFirst(['clean', `--${platform}`], sandbox);
      expect(clean.status).toBe(0);
      expect(fs.existsSync(path.join(sandbox.projectRoot, adapter.stateFile))).toBe(false);
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'using-spec-first',
      ))).toBe(false);
      for (const customPath of customPaths) {
        expect(fs.readFileSync(customPath)).toEqual(customContents.get(customPath));
      }
    },
    120000,
  );

  test('selected-host init leaves unselected legacy runtime untouched and visible', () => {
    const sandbox = tempSandbox('selected-host-boundary');
    expect(spawnSync('git', ['init', '-q'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);

    const legacyPath = '.qoder/spec-first/unselected-legacy.json';
    const legacyAbsolutePath = path.join(sandbox.projectRoot, legacyPath);
    fs.mkdirSync(path.dirname(legacyAbsolutePath), { recursive: true });
    fs.writeFileSync(legacyAbsolutePath, '{"owner":"team"}\n');
    fs.writeFileSync(path.join(sandbox.projectRoot, '.gitignore'), [
      '# spec-first:start',
      '.qoder/spec-first/',
      '# spec-first:end',
      '',
    ].join('\n'));

    const init = runSpecFirst([
      'init',
      '--codex',
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ], sandbox);
    expect(init.status).toBe(0);
    expect(fs.readFileSync(legacyAbsolutePath, 'utf8')).toBe('{"owner":"team"}\n');
    expect(fs.existsSync(path.join(
      sandbox.projectRoot,
      getAdapter('qoder').stateFile,
    ))).toBe(false);
    expect(spawnSync('git', ['check-ignore', '-q', '--', legacyPath], {
      cwd: sandbox.projectRoot,
    }).status).toBe(1);
  }, 120000);

  test('dual-host init generates and exposes exactly the selected host set', () => {
    const sandbox = tempSandbox('dual-host-selection');
    expect(spawnSync('git', ['init', '-q'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);

    const selectedPlatforms = ['claude', 'codex'];
    const initArgs = [
      'init',
      ...selectedPlatforms.map((platform) => `--${platform}`),
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];
    const init = runSpecFirst(initArgs, sandbox);
    expect(init.status).toBe(0);
    expect(`${init.stdout}\n${init.stderr}`).not.toMatch(/runtime_untrack|untrack_index/);

    for (const platform of selectedPlatforms) {
      const adapter = getAdapter(platform);
      for (const relativePath of [
        adapter.stateFile,
        path.posix.join(adapter.skillsRoot, 'using-spec-first', 'SKILL.md'),
      ]) {
        expect(fs.existsSync(path.join(sandbox.projectRoot, relativePath))).toBe(true);
        expect(spawnSync('git', ['check-ignore', '-q', '--', relativePath], {
          cwd: sandbox.projectRoot,
        }).status).toBe(1);
      }
    }

    for (const platform of getSupportedPlatforms().filter(
      (entry) => !selectedPlatforms.includes(entry),
    )) {
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        getAdapter(platform).stateFile,
      ))).toBe(false);
    }

    const preview = runSpecFirst([...initArgs, '--dry-run'], sandbox);
    expect(preview.status).toBe(0);
    expect(`${preview.stdout}\n${preview.stderr}`).not.toMatch(/runtime_untrack|untrack_index/);
  }, 120000);

  test('fresh init succeeds without a git binary in PATH', () => {
    const sandbox = tempSandbox('git-unavailable');
    const emptyBin = path.join(sandbox.home, 'empty-bin');
    fs.mkdirSync(emptyBin, { recursive: true });

    const init = spawnSync(process.execPath, [
      cliPath,
      'init',
      '--codex',
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ], {
      cwd: sandbox.projectRoot,
      env: {
        ...process.env,
        HOME: sandbox.home,
        PATH: emptyBin,
      },
      encoding: 'utf8',
      timeout: 120000,
    });

    expect(init.status).toBe(0);
    expect(fs.existsSync(path.join(
      sandbox.projectRoot,
      getAdapter('codex').stateFile,
    ))).toBe(true);
    expect(`${init.stdout}\n${init.stderr}`).not.toMatch(/runtime_untrack|untrack_index/);
  }, 120000);

  test('codex hook projection remains runnable after the project directory moves', () => {
    const sandbox = tempSandbox('codex-portable-hook');
    const init = runSpecFirst([
      'init',
      '--codex',
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ], sandbox);
    expect(init.status).toBe(0);

    const hooks = JSON.parse(fs.readFileSync(
      path.join(sandbox.projectRoot, '.codex', 'hooks.json'),
      'utf8',
    ));
    const managedHook = hooks.hooks.SessionStart[0].hooks[0];
    expect(managedHook).toMatchObject({
      type: 'command',
      command: 'node .codex/hooks/session-start',
      commandWindows: '".codex\\hooks\\session-start.cmd"',
    });

    const movedProjectRoot = path.join(path.dirname(sandbox.projectRoot), 'moved-project');
    fs.renameSync(sandbox.projectRoot, movedProjectRoot);
    const emptyBin = path.join(sandbox.home, 'empty-bin');
    fs.mkdirSync(emptyBin, { recursive: true });
    const hook = spawnSync(process.execPath, ['.codex/hooks/session-start'], {
      cwd: movedProjectRoot,
      input: '{}',
      env: {
        ...process.env,
        HOME: sandbox.home,
        PATH: emptyBin,
        CODEX_PROJECT_DIR: movedProjectRoot,
      },
      encoding: 'utf8',
      timeout: 10000,
    });
    expect(hook.status).toBe(0);
    expect(JSON.parse(hook.stdout).hookSpecificOutput.additionalContext).toContain(
      'Workflow entry governance is active',
    );
  }, 120000);

  test.each(pointerPlatforms)(
    '%s preserves a user-owned pointer and keeps immediate re-init stable',
    (platform) => {
      const sandbox = tempSandbox(`${platform}-pointer-collision`);
      const adapter = getAdapter(platform);
      const pointerPath = path.join(sandbox.projectRoot, adapter.pointerPath);
      const userOwnedContents = '# User-owned host rule\n';
      fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
      fs.writeFileSync(pointerPath, userOwnedContents);
      const initArgs = [
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ];

      const firstInit = runSpecFirst(initArgs, sandbox);
      expect(firstInit.status).toBe(0);
      expect(firstInit.stderr).toContain('host_native_pointer_user_owned_collision');
      expect(fs.readFileSync(pointerPath, 'utf8')).toBe(userOwnedContents);

      const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
      expect(secondInit.status).toBe(0);
      expect(secondInit.stderr).toContain('host_native_pointer_user_owned_collision');
      const secondOutput = `${secondInit.stdout}\n${secondInit.stderr}`;
      expect(secondOutput).not.toContain('current_runtime_drift');
      expect(secondOutput).not.toContain('managed hard reset before regenerating runtime assets');
    },
    120000,
  );

  test('same-project six-host init stays coherent and removes stale maintainer-only assets', () => {
    const sandbox = tempSandbox('all-hosts-coexistence');
    const initArgs = [
      'init',
      ...getSupportedPlatforms().map((platform) => `--${platform}`),
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];

    const firstInit = runSpecFirst(initArgs, sandbox);
    expect(firstInit.status).toBe(0);

    for (const platform of getSupportedPlatforms()) {
      const adapter = getAdapter(platform);
      const prdRoot = path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-prd',
      );
      const appAuditRoot = path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-app-consistency-audit',
      );
      fs.mkdirSync(path.join(prdRoot, 'evals'), { recursive: true });
      fs.writeFileSync(path.join(prdRoot, 'evals', 'stale.json'), '{}\n');
      fs.writeFileSync(path.join(appAuditRoot, 'README.md'), '# stale runtime maintainer README\n');
    }

    const secondInit = runSpecFirst(initArgs, sandbox);
    expect(secondInit.status).toBe(0);

    for (const platform of getSupportedPlatforms()) {
      const adapter = getAdapter(platform);
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-prd',
        'evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-app-consistency-audit',
        'README.md',
      ))).toBe(false);

      const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
      expect(doctor.status).toBe(0);
      const report = parseJsonOutput(doctor);
      expect(report.checks.filter((check) => check.drift === true)).toEqual([]);

      if (platform === 'claude') {
        expect(report.checks.find((check) => check.name === '.claude/skills')).toMatchObject({
          level: 'PASS',
          message: 'found 18 standalone/internal skill directory(ies) in .claude/skills and 17 workflow mirror directory(ies) in .claude/spec-first/workflows',
        });
      }
      if (platform === 'cursor') {
        expect(report.checks.filter((check) =>
          check.reasonCode === 'cursor_managed_projection_precedence_unverified'
        )).toHaveLength(1);
        expect(report.checks.filter((check) =>
          check.reasonCode === 'cursor_external_skill_precedence_unverified'
        )).toEqual([]);
      }
      if (platform === 'qoder') {
        expect(report.checks.filter((check) =>
          check.reasonCode === 'qoder_hook_activation_unverified'
        )).toHaveLength(3);
      }
    }
  }, 120000);

  test('six-host init keeps generated runtime visible and never mutates the git index', () => {
    const sandbox = tempSandbox('all-hosts-gitignore');
    const gitInit = spawnSync('git', ['init', '-q'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    });
    expect(gitInit.status).toBe(0);

    fs.writeFileSync(path.join(sandbox.projectRoot, '.gitignore'), [
      '# user-owned rule',
      'dist/',
      '# spec-first:start',
      '# legacy generated runtime policy',
      '.agents/skills/spec-*/',
      '.codex/spec-first/',
      '# spec-first:end',
      '',
    ].join('\n'));

    const trackedLegacyRuntime = '.agents/skills/source-command-spec-legacy/SKILL.md';
    const trackedLocalOnly = '.spec-first/config.local.yaml';
    const trackedLegacyRuntimePath = path.join(sandbox.projectRoot, trackedLegacyRuntime);
    fs.mkdirSync(path.dirname(trackedLegacyRuntimePath), { recursive: true });
    fs.writeFileSync(trackedLegacyRuntimePath, 'legacy generated runtime\n', 'utf8');
    const trackedLocalOnlyPath = path.join(sandbox.projectRoot, trackedLocalOnly);
    fs.mkdirSync(path.dirname(trackedLocalOnlyPath), { recursive: true });
    fs.writeFileSync(trackedLocalOnlyPath, 'tracked local-only config\n', 'utf8');
    const gitAdd = spawnSync('git', [
      'add',
      '-f',
      '--',
      trackedLegacyRuntime,
      trackedLocalOnly,
    ], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    });
    expect(gitAdd.status).toBe(0);

    const init = runSpecFirst([
      'init',
      ...getSupportedPlatforms().map((platform) => `--${platform}`),
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ], sandbox);
    expect(init.status).toBe(0);

    const trackedAfterInit = spawnSync('git', ['ls-files', '--', trackedLegacyRuntime], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    });
    expect(trackedAfterInit.status).toBe(0);
    expect(trackedAfterInit.stdout.trim()).toBe(trackedLegacyRuntime);

    const indexedAfterInit = spawnSync('git', ['ls-files'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    });
    expect(indexedAfterInit.status).toBe(0);
    expect(indexedAfterInit.stdout.trim().split('\n').sort()).toEqual([
      trackedLegacyRuntime,
      trackedLocalOnly,
    ].sort());

    const migratedGitignore = fs.readFileSync(
      path.join(sandbox.projectRoot, '.gitignore'),
      'utf8',
    );
    expect(migratedGitignore).toContain('# user-owned rule\ndist/');
    expect(migratedGitignore).not.toContain('.agents/skills/spec-*/');
    expect(migratedGitignore).not.toContain('.codex/spec-first/');

    for (const relativePath of [
      '.agents/skills/my-team-skill/SKILL.md',
      '.codex/config.toml',
      '.cursor/mcp.json',
      '.kiro/settings/mcp.json',
      '.qoder/settings.json',
    ]) {
      const absolutePath = path.join(sandbox.projectRoot, relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, 'team-owned\n', 'utf8');
    }

    for (const visiblePath of [
      '.agents/skills/spec-plan/SKILL.md',
      trackedLegacyRuntime,
      '.claude/spec-first/state.json',
      '.codex/spec-first/state.json',
      '.cursor/spec-first/state.json',
      '.kiro/spec-first/state.json',
      '.qoder/spec-first/state.json',
      '.opencode/spec-first/state.json',
      '.cursor/mcp.json',
      '.kiro/settings/mcp.json',
      '.qoder/settings.json',
    ]) {
      const ignored = spawnSync('git', ['check-ignore', '-q', '--', visiblePath], {
        cwd: sandbox.projectRoot,
      });
      expect(ignored.status).toBe(1);
    }

    for (const localOnlyPath of [
      '.claude/tasks/task.json',
      '.claude/worktrees/runtime.json',
      '.qoder/settings.local.json',
      '.spec-first/config.local.yaml',
      '.spec-first/workflows/run.json',
      '.codegraph/index.db',
      'graphify-out/graph.json',
    ]) {
      const absolutePath = path.join(sandbox.projectRoot, localOnlyPath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, 'local-only\n');
      const ignored = spawnSync('git', ['check-ignore', '-q', '--no-index', '--', localOnlyPath], {
        cwd: sandbox.projectRoot,
      });
      expect(ignored.status).toBe(0);
    }
  }, 120000);

  test('tracked runtime stays idempotent and clean leaves only reviewable managed deletions', () => {
    const sandbox = tempSandbox('tracked-runtime-clean');
    expect(spawnSync('git', ['init', '-q'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);
    const initArgs = [
      'init',
      '--codex',
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];
    const firstInit = runSpecFirst(initArgs, sandbox);
    expect(firstInit.status).toBe(0);
    expect(spawnSync('git', ['add', '-A'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);
    expect(spawnSync('git', [
      '-c',
      'user.name=Lifecycle Test',
      '-c',
      'user.email=lifecycle@example.invalid',
      'commit',
      '-q',
      '-m',
      'track codex runtime',
    ], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);

    const trackedBefore = spawnSync('git', ['ls-files'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).stdout;
    const secondInit = runSpecFirst(initArgs, sandbox);
    expect(secondInit.status).toBe(0);
    expect(spawnSync('git', ['ls-files'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).stdout).toBe(trackedBefore);
    expect(spawnSync('git', ['status', '--short'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).stdout).toBe('');

    const customRelativePath = '.agents/skills/spec-company-skill/SKILL.md';
    const customPath = path.join(sandbox.projectRoot, customRelativePath);
    fs.mkdirSync(path.dirname(customPath), { recursive: true });
    fs.writeFileSync(customPath, 'team-owned skill\n');
    expect(spawnSync('git', ['add', '--', customRelativePath], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);
    expect(spawnSync('git', [
      '-c',
      'user.name=Lifecycle Test',
      '-c',
      'user.email=lifecycle@example.invalid',
      'commit',
      '-q',
      '-m',
      'track team skill',
    ], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);

    const clean = runSpecFirst(['clean', '--codex'], sandbox);
    expect(clean.status).toBe(0);
    const cleanStatus = spawnSync('git', ['status', '--short'], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).stdout;
    expect(cleanStatus).toContain(' D .codex/spec-first/state.json');
    expect(cleanStatus).toContain(' D .agents/skills/using-spec-first/SKILL.md');
    expect(cleanStatus).not.toContain(customRelativePath);
    expect(fs.readFileSync(customPath, 'utf8')).toBe('team-owned skill\n');
    expect(spawnSync('git', ['ls-files', '--error-unmatch', '--', customRelativePath], {
      cwd: sandbox.projectRoot,
      encoding: 'utf8',
    }).status).toBe(0);
  }, 120000);

  test('doctor reports managed pointer body drift', () => {
    const platform = 'kiro';
    const sandbox = tempSandbox(`${platform}-pointer-drift`);
    const adapter = getAdapter(platform);
    const initArgs = [
      'init',
      `--${platform}`,
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];
    const firstInit = runSpecFirst(initArgs, sandbox);
    expect(firstInit.status).toBe(0);

    const pointerPath = path.join(sandbox.projectRoot, adapter.pointerPath);
    const pointer = fs.readFileSync(pointerPath, 'utf8');
    fs.writeFileSync(
      pointerPath,
      pointer.replace(
        `${adapter.skillsRoot}/using-spec-first/SKILL.md`,
        'skills/using-spec-first/SKILL.md',
      ),
    );

    const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
    expect(doctor.status).toBe(0);
    const report = parseJsonOutput(doctor);
    const pointerCheck = report.checks.find((check) => check.name === adapter.pointerPath);
    expect(pointerCheck).toMatchObject({
      level: 'WARNING',
      drift: true,
      reasonCode: 'host_native_pointer_content_drift',
    });

    const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
    expect(secondInit.status).toBe(0);
    expect(`${secondInit.stdout}\n${secondInit.stderr}`).toContain('current runtime drift detected');
  }, 120000);
});
