'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

const QoderAdapter = require('../../src/cli/adapters/qoder');
const { buildHostNativePointer } = require('../../src/cli/adapters/host-native-pointer');
const { buildManagedBlock } = require('../../src/cli/lang-policy');
const { buildContextBundle } = require('../../src/cli/helpers/context-bundle');
const { validateRepoRelativeField } = require('../../src/cli/helpers/target-repo');
const { applyOperationPlan } = require('../../src/cli/state');
const { computeSourcePlanHash, validateTaskPack } = require('../../src/cli/task-pack');
const {
  inspectManagedQoderHooks,
  renderManagedQoderHooksRemoval,
} = require('../../src/cli/qoder-settings');

const READINESS_HOOK_PATH = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'prd-readiness-guard');

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-qoder-'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function runGit(projectRoot, args) {
  const result = spawnSync('git', args, { cwd: projectRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function initGitProject(projectRoot) {
  runGit(projectRoot, ['init']);
  runGit(projectRoot, ['config', 'user.email', 'spec-first@example.test']);
  runGit(projectRoot, ['config', 'user.name', 'Spec First Tests']);
}

function readyPrdContent(extraFrontmatter = []) {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'status: ready-for-planning',
    ...extraFrontmatter,
    '---',
    '# Ready PRD',
    '',
  ].join('\n');
}

function writeReadyPrd(projectRoot, relativePath, extraFrontmatter = []) {
  writeText(path.join(projectRoot, relativePath), readyPrdContent(extraFrontmatter));
}

function writeFinalizeScript(projectRoot, contents) {
  writeText(
    path.join(projectRoot, '.qoder', 'skills', 'spec-prd', 'scripts', 'finalize-prd-artifact.js'),
    contents,
  );
}

function runReadinessHook(projectRoot, payload = {}) {
  return spawnSync(process.execPath, [READINESS_HOOK_PATH], {
    cwd: projectRoot,
    input: JSON.stringify({ cwd: projectRoot, ...payload }),
    encoding: 'utf8',
    env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
  });
}

function installMinimalQoderRuntime(projectRoot, adapter = new QoderAdapter()) {
  applyOperationPlan(projectRoot, { operations: adapter.planRuntimeFilesSync(projectRoot).operations });
  writeText(path.join(projectRoot, adapter.instructionFile), `${buildManagedBlock('zh')}\n`);
  writeText(
    path.join(projectRoot, adapter.skillsRoot, 'using-spec-first', 'SKILL.md'),
    '---\nname: using-spec-first\ndescription: Test entry governor.\n---\n',
  );
  writeJson(path.join(projectRoot, adapter.stateFile), {
    manifestVersion: 'test',
    platform: 'qoder',
    commands: [],
    skills: [],
    workflowSkills: [],
    agents: [],
    agentSupportFiles: [],
  });
}

function withEmptyAssetInventory(callback) {
  let output;
  jest.isolateModules(() => {
    jest.doMock('../../src/cli/plugin', () => {
      const actual = jest.requireActual('../../src/cli/plugin');
      return {
        ...actual,
        inspectInstalledAssets: () => ({
          commands: { missing: [], drifted: [] },
          skills: { missing: [], drifted: [] },
          agents: { missing: [], drifted: [] },
          agentSupportFiles: { missing: [], drifted: [] },
        }),
      };
    });
    output = callback(require('../../src/cli/commands/init'));
  });
  jest.dontMock('../../src/cli/plugin');
  return output;
}

function buildDeterministicQoderInitPlan(buildInitPlan, projectRoot, adapter) {
  return buildInitPlan({
    projectRoot,
    platform: 'qoder',
    adapter,
    name: 'Qoder Runtime Test',
    lang: 'en',
    dryRun: true,
  });
}

describe('Qoder runtime lifecycle', () => {
  test('plans Qoder pointer frontmatter and inert managed hook scripts without settings entries', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();

    const plan = adapter.planRuntimeFilesSync(projectRoot);
    const paths = plan.operations.map((operation) => operation.path);

    expect(paths).toEqual(expect.arrayContaining([
      '.qoder/rules/spec-first.md',
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
    ]));
    expect(paths).not.toContain('.qoder/settings.json');

    const pointer = plan.operations.find((operation) => operation.path === '.qoder/rules/spec-first.md');
    expect(pointer.contents).toMatch(/^---\ntrigger: always_on\n---\n/);
    const sessionStart = plan.operations.find((operation) => operation.path === '.qoder/hooks/session-start');
    expect(sessionStart.contents).toContain("'startup-reminder', '--qoder'");
    expect(sessionStart.contents).toContain('const STARTUP_REMINDER_LOOKUP_TIMEOUT_MS = 2000;');
    expect(sessionStart.contents).toContain('const STARTUP_REMINDER_PROCESS_TIMEOUT_MS = 2500;');
    expect(sessionStart.contents).toContain(JSON.stringify(path.join(
      __dirname,
      '..',
      '..',
      'bin',
      'spec-first.js',
    )));
    expect(sessionStart.contents).not.toContain(
      'const SPEC_FIRST_CLI_PATH = "__SPEC_FIRST_CLI_PATH__";',
    );
    expect(sessionStart.contents).toContain('qoder_hook_activation_unverified');
    const readinessGuard = plan.operations.find((operation) =>
      operation.path === '.qoder/hooks/prd-readiness-guard'
    );
    expect(readinessGuard.contents).toContain('qoder_hook_activation_unverified');
    for (const hookPath of [
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
    ]) {
      const hookOperation = plan.operations.find((operation) => operation.path === hookPath);
      expect(hookOperation).toMatchObject({
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(hookOperation.contents).not.toContain(
        'after Qoder hook protocol support is confirmed',
      );
    }
  });

  test('generated Qoder session-start lets the child finish within the bounded lookup budget', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    const plan = adapter.planRuntimeFilesSync(projectRoot);
    const sessionStart = plan.operations.find((operation) => operation.path === '.qoder/hooks/session-start');
    const bundledCliPath = path.join(__dirname, '..', '..', 'bin', 'spec-first.js');
    const fakeCliPath = path.join(projectRoot, 'test-bin', 'spec-first.js');
    const hookPath = path.join(projectRoot, '.qoder', 'hooks', 'session-start');

    writeText(fakeCliPath, [
      "'use strict';",
      'setTimeout(() => {',
      "  process.stdout.write(`[spec-first] Update available for Qoder runtime: 1.0.0 -> 1.1.0; lookup_timeout=${process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS}\\n`);",
      '}, 1300);',
      '',
    ].join('\n'));
    writeText(
      hookPath,
      sessionStart.contents.replace(
        JSON.stringify(bundledCliPath),
        () => JSON.stringify(fakeCliPath),
      ),
    );
    writeText(path.join(projectRoot, 'AGENTS.md'), `${buildManagedBlock('en')}\n`);

    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input: JSON.stringify({ cwd: projectRoot }),
      encoding: 'utf8',
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
    });

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput).toMatchObject({
      hookEventName: 'SessionStart',
    });
    expect(output.hookSpecificOutput.additionalContext).toContain(
      '[spec-first] Update available for Qoder runtime: 1.0.0 -> 1.1.0',
    );
    expect(output.hookSpecificOutput.additionalContext).toContain('lookup_timeout=2000');
  });

  test('Qoder session-start drains stdin even when QODER_PROJECT_DIR is already set', async () => {
    const projectRoot = tempProject();
    const hookPath = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'session-start');
    writeText(path.join(projectRoot, 'AGENTS.md'), `${buildManagedBlock('en')}\n`);

    const child = spawn(process.execPath, [hookPath], {
      cwd: projectRoot,
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdinError = null;
    let stdout = '';
    child.stdin.on('error', (error) => {
      stdinError = error;
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stdin.end(JSON.stringify({
      cwd: projectRoot,
      padding: 'x'.repeat(1024 * 1024),
    }));

    const exitCode = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });

    expect(stdinError).toBeNull();
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout).hookSpecificOutput.hookEventName).toBe('SessionStart');
  });

  test('removes stale managed settings entries while preserving user hooks', () => {
    const projectRoot = tempProject();
    const settingsPath = path.join(projectRoot, '.qoder', 'settings.json');
    writeJson(settingsPath, {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [{ type: 'command', command: 'node .qoder/hooks/session-start' }],
          },
          {
            matcher: 'startup',
            hooks: [
              { type: 'command', command: 'node scripts/user-hook.js' },
              { type: 'command', command: 'node scripts/wrapper.js .qoder/hooks/session-start' },
              { type: 'command', command: 'node .qoder/hooks/session-start --project-mode' },
              { type: 'command', command: 'node', args: ['./.qoder/hooks/session-start', '--project-mode'] },
              { type: 'command', command: 'bash', args: ['-lc', 'node .qoder/hooks/session-start'] },
            ],
          },
        ],
        Stop: [
          {
            hooks: [{ type: 'command', command: 'node', args: ['./.qoder/hooks/prd-readiness-guard'] }],
          },
        ],
      },
      permissions: { allow: ['Read'] },
    });

    const rendered = renderManagedQoderHooksRemoval(projectRoot);
    expect(rendered.existsAfter).toBe(true);
    const next = JSON.parse(rendered.contents);
    expect(next.permissions).toEqual({ allow: ['Read'] });
    expect(next.hooks.SessionStart).toEqual([
      {
        matcher: 'startup',
        hooks: [
          { type: 'command', command: 'node scripts/user-hook.js' },
          { type: 'command', command: 'node scripts/wrapper.js .qoder/hooks/session-start' },
          { type: 'command', command: 'node .qoder/hooks/session-start --project-mode' },
          { type: 'command', command: 'node', args: ['./.qoder/hooks/session-start', '--project-mode'] },
          { type: 'command', command: 'bash', args: ['-lc', 'node .qoder/hooks/session-start'] },
        ],
      },
    ]);
    expect(next.hooks.Stop).toBeUndefined();
  });

  test('reports activation-unverified settings entries as degraded by design, not drift', () => {
    const projectRoot = tempProject();
    const statuses = inspectManagedQoderHooks(projectRoot);

    expect(statuses).toHaveLength(3);
    for (const status of statuses) {
      expect(status).toMatchObject({
        status: 'degraded-by-design',
        drift: false,
        degradedByDesign: true,
        reasonCode: 'qoder_hook_activation_unverified',
        message: expect.stringContaining('qodercli 1.0.41 evidence baseline confirms the settings and command protocol'),
      });
    }
  });

  test('does not classify user wrapper settings hooks as managed Qoder hook drift', () => {
    const projectRoot = tempProject();
    writeJson(path.join(projectRoot, '.qoder', 'settings.json'), {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [
              { type: 'command', command: 'node scripts/wrapper.js .qoder/hooks/session-start' },
              { type: 'command', command: 'bash', args: ['-lc', 'node .qoder/hooks/session-start'] },
            ],
          },
        ],
      },
    });

    const statuses = inspectManagedQoderHooks(projectRoot);

    expect(statuses.every((status) => status.drift === false && status.degradedByDesign === true))
      .toBe(true);
  });

  test('reports unreadable Qoder settings as drift that init must not ignore', () => {
    const projectRoot = tempProject();
    writeText(path.join(projectRoot, '.qoder', 'settings.json'), '{ invalid json');

    const statuses = inspectManagedQoderHooks(projectRoot);

    expect(statuses).toHaveLength(3);
    for (const status of statuses) {
      expect(status).toMatchObject({
        status: 'drifted',
        drift: true,
        degradedByDesign: false,
        reasonCode: 'qoder_settings_unreadable',
      });
    }
  });

  test('installed hook files pass inspection while settings stays degraded by design', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    const plan = adapter.planRuntimeFilesSync(projectRoot);
    applyOperationPlan(projectRoot, { operations: plan.operations });

    const checks = adapter.inspectRuntimeFiles(projectRoot);
    expect(checks.find((check) => check.name === '.qoder/rules/spec-first.md')).toMatchObject({
      level: 'PASS',
    });
    expect(checks.filter((check) => check.name.startsWith('.qoder/hooks/')).map((check) => check.level))
      .toEqual(['PASS', 'PASS', 'PASS']);
    expect(checks.filter((check) => check.name.startsWith('.qoder/settings.json '))).toHaveLength(3);
    expect(checks.filter((check) => check.name.startsWith('.qoder/settings.json ')).every((check) =>
      check.level === 'WARNING' && check.degradedByDesign === true && check.drift === false
    )).toBe(true);
  });

  test('reports managed Qoder pointer missing always-on frontmatter as runtime drift', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    writeText(
      path.join(projectRoot, '.qoder', 'rules', 'spec-first.md'),
      buildHostNativePointer({
        hostLabel: 'Qoder',
        initCommand: 'spec-first init --qoder',
        workflowPolicy: '.qoder/skills/using-spec-first/SKILL.md',
      }),
    );

    const pointerCheck = adapter.inspectRuntimeFiles(projectRoot)
      .find((check) => check.name === '.qoder/rules/spec-first.md');

    expect(pointerCheck).toMatchObject({
      level: 'WARNING',
      message: 'Qoder host-native spec-first pointer drifted from expected metadata',
    });
  });

  test('Qoder removal lifecycle plans and removes managed hook files without settings writes', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    applyOperationPlan(projectRoot, { operations: adapter.planRuntimeFilesSync(projectRoot).operations });

    const removal = adapter.planRuntimeFilesRemoval(projectRoot);
    expect(removal.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'remove_file', path: '.qoder/hooks/session-start' }),
      expect.objectContaining({ kind: 'remove_file', path: '.qoder/hooks/prd-prewrite-guard' }),
      expect.objectContaining({ kind: 'remove_file', path: '.qoder/hooks/prd-readiness-guard' }),
    ]));
    expect(removal.operations.map((operation) => operation.path)).not.toContain('.qoder/settings.json');

    adapter.removeRuntimeFiles(projectRoot);

    for (const hookPath of [
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
    ]) {
      expect(fs.existsSync(path.join(projectRoot, hookPath))).toBe(false);
    }
    expect(fs.existsSync(path.join(projectRoot, '.qoder', 'hooks'))).toBe(false);
  });

  test('Qoder prewrite hook blocks ready PRD mutation without leaking absolute paths', () => {
    const projectRoot = tempProject();
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const hookPath = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'prd-prewrite-guard');
    const payload = {
      tool_name: 'Write',
      cwd: projectRoot,
      tool_input: {
        file_path: target,
        content: [
          '---',
          'artifact_kind: prd-requirements',
          'status: ready-for-planning',
          '---',
        ].join('\n'),
      },
    };

    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input: JSON.stringify(payload),
      encoding: 'utf8',
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/sample-requirements.md');
    expect(result.stderr).not.toContain(projectRoot);
    expect(result.stdout).toBe('');
  });

  test('Qoder prewrite hook blocks readiness outcome ready claims', () => {
    const projectRoot = tempProject();
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const hookPath = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'prd-prewrite-guard');
    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input: JSON.stringify({
        tool_name: 'Write',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          content: [
            '---',
            'artifact_kind: prd-requirements',
            'status: draft',
            'readiness_outcome: ready-for-planning',
            '---',
          ].join('\n'),
        },
      }),
      encoding: 'utf8',
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/sample-requirements.md');
    expect(result.stderr).not.toContain(projectRoot);
  });

  test('Qoder prewrite hook blocks first PRD writes without write_mode', () => {
    const projectRoot = tempProject();
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const hookPath = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'prd-prewrite-guard');
    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input: JSON.stringify({
        tool_name: 'Write',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          content: [
            '---',
            'artifact_kind: prd-requirements',
            'status: draft',
            '---',
            '# Draft PRD',
            '',
          ].join('\n'),
        },
      }),
      encoding: 'utf8',
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('write_mode');
    expect(result.stderr).toContain('docs/brainstorms/sample-requirements.md');
    expect(result.stderr).not.toContain(projectRoot);
  });

  test('Qoder prewrite hook allows first checkpoint PRD draft writes', () => {
    const projectRoot = tempProject();
    const target = path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md');
    const hookPath = path.join(__dirname, '..', '..', 'templates', 'qoder', 'hooks', 'prd-prewrite-guard');
    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input: JSON.stringify({
        tool_name: 'Write',
        cwd: projectRoot,
        tool_input: {
          file_path: target,
          content: [
            '---',
            'artifact_kind: prd-requirements',
            'status: draft',
            'write_mode: checkpoint-prd',
            'can_enter_spec_plan: no',
            '---',
            '# Draft PRD',
            '',
          ].join('\n'),
        },
      }),
      encoding: 'utf8',
      env: { ...process.env, QODER_PROJECT_DIR: projectRoot },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('Qoder readiness hook bypasses recursive stop hook execution', () => {
    const projectRoot = tempProject();

    const result = runReadinessHook(projectRoot, { stop_hook_active: true });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('Qoder readiness hook blocks when git status is unavailable', () => {
    const projectRoot = tempProject();

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('reason_codes: git_status_unavailable');
    expect(result.stderr).not.toContain(projectRoot);
  });

  test('Qoder readiness hook blocks changed ready PRDs when finalize script is missing', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeReadyPrd(projectRoot, 'docs/brainstorms/sample-requirements.md');

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/sample-requirements.md');
    expect(result.stderr).not.toContain(projectRoot);
  });

  test('Qoder readiness hook blocks readiness outcome ready claims', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeText(path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md'), [
      '---',
      'artifact_kind: prd-requirements',
      'status: draft',
      'readiness_outcome: ready-for-planning',
      '---',
      '# Ready Outcome PRD',
      '',
    ].join('\n'));

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/sample-requirements.md');
    expect(result.stderr).not.toContain(projectRoot);
  });

  test('Qoder readiness hook ignores machine receipt examples outside frontmatter', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeText(path.join(projectRoot, 'docs', 'brainstorms', 'sample-requirements.md'), [
      '---',
      'artifact_kind: prd-requirements',
      'status: draft',
      'write_mode: checkpoint-prd',
      'can_enter_spec_plan: no',
      '---',
      '# Draft PRD',
      '',
      '```yaml',
      'readiness_prd_hash: example-only',
      '```',
      '',
    ].join('\n'));

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('Qoder readiness hook allows changed ready PRDs when finalize check succeeds', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeReadyPrd(projectRoot, 'docs/brainstorms/sample-requirements.md');
    writeFinalizeScript(projectRoot, 'process.exit(0);\n');

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  test('Qoder readiness hook surfaces producer-local finalize reason codes', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeReadyPrd(projectRoot, 'docs/brainstorms/sample-requirements.md');
    writeFinalizeScript(projectRoot, [
      'process.stdout.write(JSON.stringify({',
      "  blocking_reason_codes: ['prd_hash_mismatch', 'source_inputs_missing'],",
      '}));',
      'process.exit(1);',
      '',
    ].join('\n'));

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('reason_codes: prd_hash_mismatch, source_inputs_missing');
  });

  test('Qoder readiness hook checks renamed ready PRD destination paths', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeReadyPrd(projectRoot, 'docs/brainstorms/old-requirements.md');
    runGit(projectRoot, ['add', 'docs/brainstorms/old-requirements.md']);
    runGit(projectRoot, ['commit', '-m', 'test: add old prd']);
    runGit(projectRoot, ['mv', 'docs/brainstorms/old-requirements.md', 'docs/brainstorms/new-requirements.md']);

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/new-requirements.md');
    expect(result.stderr).not.toContain('docs/brainstorms/old-requirements.md');
  });

  test('Qoder readiness hook blocks copied ready PRD destination paths', () => {
    const projectRoot = tempProject();
    initGitProject(projectRoot);
    writeReadyPrd(projectRoot, 'docs/brainstorms/old-requirements.md');
    runGit(projectRoot, ['add', 'docs/brainstorms/old-requirements.md']);
    runGit(projectRoot, ['commit', '-m', 'test: add old prd']);
    fs.copyFileSync(
      path.join(projectRoot, 'docs', 'brainstorms', 'old-requirements.md'),
      path.join(projectRoot, 'docs', 'brainstorms', 'copy-requirements.md'),
    );
    runGit(projectRoot, ['add', 'docs/brainstorms/copy-requirements.md']);

    const result = runReadinessHook(projectRoot);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('docs/brainstorms/copy-requirements.md');
    expect(result.stderr).not.toContain('docs/brainstorms/old-requirements.md');
  });

  test('Qoder init ignores degraded settings warnings while stale managed settings still drift', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    installMinimalQoderRuntime(projectRoot, adapter);

    const degradedOnlyPlan = withEmptyAssetInventory(({ buildInitPlan }) => (
      buildDeterministicQoderInitPlan(buildInitPlan, projectRoot, adapter)
    ));
    expect(degradedOnlyPlan.destructiveResetReason).toBe('');
    expect(degradedOnlyPlan.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        level: 'warn',
        code: 'qoder_hook_activation_unverified',
      }),
    ]));
    expect(degradedOnlyPlan.diagnostics.map((diagnostic) => diagnostic.code))
      .not.toContain('current_runtime_drift');

    writeJson(path.join(projectRoot, '.qoder', 'settings.json'), {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [{ type: 'command', command: 'node .qoder/hooks/session-start' }],
          },
        ],
      },
    });

    const staleSettingsPlan = withEmptyAssetInventory(({ buildInitPlan }) => (
      buildDeterministicQoderInitPlan(buildInitPlan, projectRoot, adapter)
    ));
    expect(staleSettingsPlan.destructiveResetReason).toBe('current_runtime_drift');
    const driftDiagnostic = staleSettingsPlan.diagnostics.find((diagnostic) =>
      diagnostic.code === 'current_runtime_drift'
    );
    expect(driftDiagnostic.reasons.some((reason) => reason.includes('qoder_settings_json_sessionstart')))
      .toBe(true);
  });

  test('Qoder init does not treat user wrapper settings hooks as current runtime drift', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    installMinimalQoderRuntime(projectRoot, adapter);
    writeJson(path.join(projectRoot, '.qoder', 'settings.json'), {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [{ type: 'command', command: 'node scripts/wrapper.js .qoder/hooks/session-start' }],
          },
        ],
      },
    });

    const plan = withEmptyAssetInventory(({ buildInitPlan }) => (
      buildDeterministicQoderInitPlan(buildInitPlan, projectRoot, adapter)
    ));

    expect(plan.destructiveResetReason).toBe('');
    expect(plan.diagnostics.map((diagnostic) => diagnostic.code))
      .not.toContain('current_runtime_drift');
  });

  test('Qoder init treats unreadable settings as current runtime drift', () => {
    const projectRoot = tempProject();
    const adapter = new QoderAdapter();
    installMinimalQoderRuntime(projectRoot, adapter);
    writeText(path.join(projectRoot, '.qoder', 'settings.json'), '{ invalid json');

    const plan = withEmptyAssetInventory(({ buildInitPlan }) => (
      buildDeterministicQoderInitPlan(buildInitPlan, projectRoot, adapter)
    ));

    expect(plan.destructiveResetReason).toBe('current_runtime_drift');
    const driftDiagnostic = plan.diagnostics.find((diagnostic) => diagnostic.code === 'current_runtime_drift');
    expect(driftDiagnostic.reasons.some((reason) => reason.includes('qoder_settings_json_sessionstart')))
      .toBe(true);
  });

  test('runtime path validators reject exact managed hook files without rejecting same-prefix user paths', () => {
    const errors = [];
    validateRepoRelativeField('.qoder/hooks/session-start', 'evidence_refs[]', errors);
    expect(errors).toContain('evidence_refs[] must not point at generated runtime mirrors');

    const samePrefixErrors = [];
    validateRepoRelativeField('.qoder/hooks/session-start-backup', 'evidence_refs[]', samePrefixErrors);
    expect(samePrefixErrors).not.toContain('evidence_refs[] must not point at generated runtime mirrors');

    const projectRoot = tempProject();
    const sourcePlanPath = path.join(projectRoot, 'docs', 'plans', 'source-plan.md');
    writeText(sourcePlanPath, [
      '---',
      'spec_id: qoder-runtime-prefix',
      '---',
      '# Source Plan',
      '',
    ].join('\n'));
    const sourcePlanHash = computeSourcePlanHash(sourcePlanPath).hash;
    const userPath = path.join(projectRoot, '.qoder', 'hooks', 'session-start-backup');
    writeText(userPath, 'user-owned qoder hook note\n');
    const taskPackPath = path.join(projectRoot, 'docs', 'tasks', 'task-pack.md');
    const contract = {
      schema_version: 'task-pack/v1',
      tasks: [
        {
          task_id: 'T1',
          source_unit: 'U1',
          dependencies: [],
          files: ['.qoder/hooks/session-start-backup'],
          goal: 'touch a user-owned same-prefix file',
          test_focus: 'validator boundary',
          done_signal: 'validator does not classify same-prefix path as generated runtime',
          wave: '1',
          stop_if: 'path boundary fails',
        },
      ],
      execution_waves: [
        { wave: '1', tasks: ['T1'] },
      ],
    };
    writeText(taskPackPath, [
      '---',
      'type: task-pack',
      'generated_by: spec-write-tasks',
      'status: derived',
      'mode: derived',
      'spec_id: qoder-runtime-prefix',
      'source_plan: docs/plans/source-plan.md',
      `source_plan_hash: ${sourcePlanHash}`,
      '---',
      '',
      '## Task Pack Contract',
      '',
      '```json',
      JSON.stringify(contract, null, 2),
      '```',
      '',
    ].join('\n'));

    const result = validateTaskPack(taskPackPath, { repoRoot: projectRoot });
    expect(result.errors.map((error) => error.code)).not.toContain('task-pack-task-file-generated-runtime');
    expect(result.task_pack_validity).toBe('valid');
  });

  test('context bundle excludes exact managed Qoder hooks without excluding same-prefix user paths', () => {
    const projectRoot = tempProject();
    writeText(path.join(projectRoot, '.qoder', 'hooks', 'session-start'), 'managed hook\n');
    writeText(path.join(projectRoot, '.qoder', 'hooks', 'session-start-backup'), 'user note\n');

    const bundle = buildContextBundle({
      stage: 'work',
      intent: 'qoder hook boundary',
      changedFiles: ['.qoder/hooks/session-start', '.qoder/hooks/session-start-backup'],
      relatedPaths: [],
      artifactSummaries: [],
      evidencePaths: [],
      fullReadTriggers: [],
      maxFiles: 20,
      maxTokens: 60000,
      allowRuntimeContext: false,
    }, { cwd: projectRoot, repoRoot: projectRoot });

    expect(bundle.excluded_context).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '.qoder/hooks/session-start',
        reason_code: 'managed_runtime_hook_excluded',
      }),
    ]));
    expect(bundle.related_paths).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '.qoder/hooks/session-start-backup',
      }),
    ]));
  });
});
