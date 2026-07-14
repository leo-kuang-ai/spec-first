'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CodexAdapter = require('../../src/cli/adapters/codex');
const { buildInitPlan } = require('../../src/cli/commands/init-plan');
const {
  applyWorkspaceInitPlan,
  buildWorkspaceInitPlan,
  buildWorkspaceInitSummary,
  buildWorkspaceInitSummaryIndex,
  readWorkspaceInitSummaryIndex,
} = require('../../src/cli/commands/init-workspace');
const {
  printHelp,
  printInitApplySummaries,
  printInitPreview,
} = require('../../src/cli/commands/init-output');

const EXPECTED_PARENT_ARTIFACT_AUTHORITY = Object.freeze({
  physical_scope: 'workspace-root-local',
  instruction_scope: 'parent-session-governance',
  host_runtime_scope: 'parent-workspace',
  workspace_summary_authority: 'advisory',
  child_repo_canonical: false,
  child_repo_setup_truth: false,
  child_repo_readiness_truth: false,
});

const USER_CONTRACT_PATHS = [
  'README.md',
  'README.zh-CN.md',
  'docs/05-用户手册/01-快速开始.md',
  'docs/05-用户手册/02-核心概念.md',
  'docs/05-用户手册/05-最佳实践.md',
  'docs/05-用户手册/08-三种开发模式.md',
  'docs/05-用户手册/12-gitignore参考.md',
  'docs/contracts/parent-artifact-quarantine.md',
];

const tempRoots = [];

function createWorkspace(options = {}) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-workspace-'));
  const childRoot = path.join(workspaceRoot, 'child-app');
  fs.mkdirSync(path.join(childRoot, '.git'), { recursive: true });
  if (options.existingChangelogs) {
    fs.writeFileSync(path.join(workspaceRoot, 'CHANGELOG.md'), '# Parent changelog\n');
    fs.writeFileSync(path.join(childRoot, 'CHANGELOG.md'), '# Child changelog\n');
  }
  tempRoots.push(workspaceRoot);
  return { workspaceRoot, childRoot };
}

function buildCodexWorkspacePlan(workspaceRoot, childRoot, options = {}) {
  return buildWorkspaceInitPlan({
    platform: 'codex',
    adapter: new CodexAdapter(),
    workspaceRoot,
    candidates: [{
      repo_label: 'child-app',
      git_root: childRoot,
      workspace_relative_path: 'child-app',
      relationship: 'child_git_repo',
    }],
    selectionSource: 'explicit-all-repos',
    platformCount: 1,
    platforms: ['codex'],
    name: 'Workspace Contract Test',
    lang: 'zh',
    dryRun: options.dryRun !== undefined ? options.dryRun : true,
  });
}

function effectiveGlobalWrite(resolvedPath) {
  return {
    action: 'create',
    globalPath: '~/.spec-first/.developer',
    resolvedPath,
    developer: {
      name: 'Workspace Contract Test',
      lang: 'zh',
      initializedAt: '2026-07-11T00:00:00.000Z',
      version: '1.13.2',
      hosts: ['codex'],
    },
  };
}

function operationPaths(projectPlan) {
  return projectPlan.operationPlan.operations.map((operation) => operation.path);
}

function readyParentRuntime() {
  return {
    exit_code: 0,
    overall_status: 'ready',
    reason_code: null,
    diagnostic: '',
    runtime_untrack: { count: 0 },
  };
}

function readyChildResult(childRoot) {
  return {
    repo_label: 'child-app',
    workspace_relative_path: 'child-app',
    git_root: childRoot,
    exit_code: 0,
    overall_status: 'ready',
    reason_code: null,
    diagnostic: '',
    runtime_untrack: { count: 0 },
  };
}

function readUserContract() {
  return USER_CONTRACT_PATHS.map((relativePath) => (
    `${relativePath}\n${fs.readFileSync(path.join(__dirname, '..', '..', relativePath), 'utf8')}`
  )).join('\n');
}

function runInitCli(workspaceRoot, args) {
  const homeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-home-'));
  tempRoots.push(homeRoot);
  return spawnSync(process.execPath, [
    path.join(__dirname, '..', '..', 'bin', 'spec-first.js'),
    'init',
    ...args,
  ], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: homeRoot,
      NO_COLOR: '1',
    },
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  for (const tempRoot of tempRoots.splice(0)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('init workspace contract', () => {
  test('characterizes full parent and child bootstrap operation paths without shrinking either target', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot);
    const expectedBootstrapPaths = [
      'AGENTS.md',
      '.gitignore',
      'CHANGELOG.md',
      '.codex/spec-first/state.json',
    ];

    expect(plan.parentPlan.gitRootTopology).toBe('multi-repo-workspace');
    expect(operationPaths(plan.parentPlan)).toEqual(expect.arrayContaining(expectedBootstrapPaths));
    expect(plan.childPlans).toHaveLength(1);
    expect(plan.childPlans[0].plan.gitRootTopology).toBe('single-repo');
    expect(operationPaths(plan.childPlans[0].plan)).toEqual(expect.arrayContaining(expectedBootstrapPaths));

    const childOnlyPlan = buildInitPlan({
      platform: 'codex',
      adapter: new CodexAdapter(),
      target: { mode: 'single-repo', projectRoot: childRoot },
      platforms: ['codex'],
      name: 'Workspace Contract Test',
      lang: 'zh',
      dryRun: true,
    });
    expect(childOnlyPlan.mode).toBe('single-repo');
    expect(childOnlyPlan.projectRoot).toBe(fs.realpathSync.native(childRoot));
  });

  test('preserves existing parent and child changelogs', () => {
    const { workspaceRoot, childRoot } = createWorkspace({ existingChangelogs: true });
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot);

    expect(operationPaths(plan.parentPlan)).not.toContain('CHANGELOG.md');
    expect(operationPaths(plan.childPlans[0].plan)).not.toContain('CHANGELOG.md');
    expect(fs.readFileSync(path.join(workspaceRoot, 'CHANGELOG.md'), 'utf8')).toBe('# Parent changelog\n');
    expect(fs.readFileSync(path.join(childRoot, 'CHANGELOG.md'), 'utf8')).toBe('# Child changelog\n');
  });

  test('projects the physical parent writes and fixed authority shape into summary and index', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot);
    const summary = buildWorkspaceInitSummary({
      workspaceRoot,
      plan,
      parentRuntime: readyParentRuntime(),
      results: [readyChildResult(childRoot)],
    });
    const index = buildWorkspaceInitSummaryIndex({
      workspaceRoot,
      summaryPath: path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json'),
      currentSummary: summary,
      currentSummaryRelativePath: '.spec-first/workspace/init-summary-codex.json',
    });

    expect(summary.parent_writes_repo_local_artifacts).toBe(true);
    expect(summary.parent_artifact_authority).toEqual(EXPECTED_PARENT_ARTIFACT_AUTHORITY);
    expect(index.parent_writes_repo_local_artifacts).toBe(true);
    expect(index.parent_artifact_authority).toEqual(EXPECTED_PARENT_ARTIFACT_AUTHORITY);
  });

  test('keeps workspace summary v1 compatible in both reader directions', () => {
    const { workspaceRoot } = createWorkspace();
    const summaryPath = path.join(workspaceRoot, '.spec-first', 'workspace', 'init-summary.json');
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    const legacyPayload = Object.freeze({
      schema_version: 'workspace-init-summary.v1',
      platform: 'codex',
      generated_at: '2026-07-11T00:00:00.000Z',
      overall_status: 'ready',
      reason_code: null,
      parent_writes_repo_local_artifacts: false,
      counts: Object.freeze({
        total: 1,
        ready: 1,
        action_required: 0,
        parent_runtime_ready: 1,
        parent_runtime_action_required: 0,
        runtime_untrack_total: 0,
      }),
    });
    fs.writeFileSync(summaryPath, `${JSON.stringify(legacyPayload, null, 2)}\n`);

    const newReaderResult = readWorkspaceInitSummaryIndex(summaryPath, workspaceRoot);
    expect(newReaderResult.platforms.codex).toMatchObject({
      platform: 'codex',
      overall_status: 'ready',
      counts: legacyPayload.counts,
    });
    expect(newReaderResult).toHaveProperty('parent_artifact_authority', null);

    const newPayload = Object.freeze({
      ...legacyPayload,
      parent_writes_repo_local_artifacts: true,
      parent_artifact_authority: EXPECTED_PARENT_ARTIFACT_AUTHORITY,
    });
    const frozenLegacyReader = (payload) => ({
      platform: payload.platform,
      parent_writes_repo_local_artifacts: payload.parent_writes_repo_local_artifacts,
      counts: payload.counts,
    });
    expect(frozenLegacyReader(newPayload)).toEqual({
      platform: 'codex',
      parent_writes_repo_local_artifacts: true,
      counts: legacyPayload.counts,
    });
  });

  test('applies the parent and children after writing one run-level global profile', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot, { dryRun: false });
    const resolvedPath = path.join(workspaceRoot, 'home', '.spec-first', '.developer');
    const writer = jest.fn();

    const result = applyWorkspaceInitPlan(workspaceRoot, plan, {
      effectiveGlobalDeveloperWrite: effectiveGlobalWrite(resolvedPath),
      getGlobalDeveloperPath: () => resolvedPath,
      writeGlobalDeveloperFile: writer,
    });

    expect(result.exit_code).toBe(0);
    expect(writer).toHaveBeenCalledTimes(1);
    expect(result.globalDeveloperWriteResult).toMatchObject({
      action: 'create',
      status: 'applied',
      applied: true,
      resolvedPath,
    });
    expect(result.workspace_summary_paths).toEqual([
      '.spec-first/workspace/init-summary.json',
      '.spec-first/workspace/init-summary-codex.json',
    ]);
    for (const targetRoot of [workspaceRoot, childRoot]) {
      for (const relativePath of [
        'AGENTS.md',
        '.gitignore',
        'CHANGELOG.md',
        '.codex/spec-first/state.json',
      ]) {
        expect(fs.existsSync(path.join(targetRoot, relativePath))).toBe(true);
      }
    }
  });

  test('global profile failure stops parent, children, summaries, and reset backup creation', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot, { dryRun: false });
    const parentRuntimePath = path.join(workspaceRoot, 'existing-runtime.txt');
    const childRuntimePath = path.join(childRoot, 'existing-runtime.txt');
    fs.writeFileSync(parentRuntimePath, 'parent runtime\n');
    fs.writeFileSync(childRuntimePath, 'child runtime\n');
    plan.parentPlan.destructiveResetPlan = {
      operations: [{ kind: 'remove_file', path: 'existing-runtime.txt' }],
      summary: { remove_file: 1 },
    };
    plan.childPlans[0].plan.destructiveResetPlan = {
      operations: [{ kind: 'remove_file', path: 'existing-runtime.txt' }],
      summary: { remove_file: 1 },
    };
    const resolvedPath = path.join(workspaceRoot, 'blocked-home', '.spec-first', '.developer');
    const primaryError = Object.assign(new Error('global profile write denied'), {
      code: 'EACCES',
    });
    const writer = jest.fn(() => {
      throw primaryError;
    });
    const backupSpy = jest.spyOn(fs, 'mkdtempSync');

    let thrown;
    try {
      applyWorkspaceInitPlan(workspaceRoot, plan, {
        effectiveGlobalDeveloperWrite: effectiveGlobalWrite(resolvedPath),
        getGlobalDeveloperPath: () => resolvedPath,
        writeGlobalDeveloperFile: writer,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(primaryError);
    expect(thrown).toMatchObject({ code: 'EACCES', globalDeveloperTargetPath: resolvedPath });
    expect(thrown.message).toContain('global profile write denied');
    expect(writer).toHaveBeenCalledTimes(1);
    expect(backupSpy).not.toHaveBeenCalled();
    expect(fs.readFileSync(parentRuntimePath, 'utf8')).toBe('parent runtime\n');
    expect(fs.readFileSync(childRuntimePath, 'utf8')).toBe('child runtime\n');
    for (const targetRoot of [workspaceRoot, childRoot]) {
      for (const relativePath of [
        'AGENTS.md',
        '.gitignore',
        'CHANGELOG.md',
        '.codex',
      ]) {
        expect(fs.existsSync(path.join(targetRoot, relativePath))).toBe(false);
      }
    }
    expect(fs.existsSync(path.join(workspaceRoot, '.spec-first', 'workspace'))).toBe(false);
  });

  test('unsafe summary path preserves run-level result shape and parent runtime-untrack evidence', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-summary-escape-'));
    tempRoots.push(outsideRoot);
    fs.symlinkSync(
      outsideRoot,
      path.join(workspaceRoot, '.spec-first'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot, { dryRun: false });
    plan.parentPlan.untrackDiagnostic = {
      count: 2,
      reason_code: 'untracked-runtime',
      sample_paths: ['.codex/tracked-a', '.codex/tracked-b'],
      diagnostic: 'parent-specific runtime-untrack evidence',
    };
    const resolvedPath = path.join(workspaceRoot, 'home', '.spec-first', '.developer');
    const writer = jest.fn();

    const result = applyWorkspaceInitPlan(workspaceRoot, plan, {
      effectiveGlobalDeveloperWrite: effectiveGlobalWrite(resolvedPath),
      getGlobalDeveloperPath: () => resolvedPath,
      writeGlobalDeveloperFile: writer,
    });

    expect(result).toMatchObject({
      exit_code: 1,
      workspace_summary_paths: [],
      runtime_untrack: {
        count: 0,
        reason_code: 'none-tracked',
        sample_paths: ['.codex/tracked-a', '.codex/tracked-b'],
        diagnostic: 'parent-specific runtime-untrack evidence',
      },
      globalDeveloperWriteResult: {
        action: 'create',
        status: 'applied',
        resolvedPath,
      },
      error: 'workspace init summary path is unsafe (workspace-summary-symlink-escape)',
    });
    expect(result.runtime_untrack).toEqual(
      result.workspace_summary.parent_host_runtime.runtime_untrack,
    );
    expect(writer).toHaveBeenCalledTimes(1);
    expect(fs.readdirSync(outsideRoot)).toEqual([]);
  });

  test('uses workspace bootstrap language in preview, help, and current user contracts', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const plan = buildCodexWorkspacePlan(workspaceRoot, childRoot);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    printInitPreview(plan, { lang: 'en', useColor: false });
    printHelp();

    const cliOutput = logSpy.mock.calls.flat().join('\n');
    expect(cliOutput).toContain('Parent workspace bootstrap:');
    expect(cliOutput).toContain('Initialize the parent workspace bootstrap only.');
    expect(cliOutput).not.toContain('Parent runtime assets:');
    expect(cliOutput).not.toContain('Initialize parent workspace runtime only.');
    expect(cliOutput).not.toContain('spec-mcp-setup');
    expect(cliOutput).not.toContain('mcp-setup');

    const userContract = readUserContract();
    for (const staleContract of [
      'init defaults to writing only the parent workspace runtime',
      '默认只写父级 workspace runtime',
      '默认只写父 workspace runtime',
      '父 workspace 只能写 advisory `.spec-first/workspace/*summary.json`',
      '父 workspace 中 spec-first init 默认只写父级 runtime',
      '父 workspace 只允许写 `.spec-first/workspace/*summary.json`',
      '`init` 默认只初始化父 workspace host runtime 和父级入口文档',
    ]) {
      expect(userContract).not.toContain(staleContract);
    }
    expect(userContract).toContain(
      '默认在父 workspace root 执行完整 bootstrap：写入 instruction、`.gitignore`、缺失时的 `CHANGELOG.md` 以及 selected host runtime/state',
    );
  });

  test('reports parent-only workspace child projections as pending with the narrow all-repos and repo handoffs', () => {
    const { workspaceRoot } = createWorkspace();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    printInitApplySummaries([{
      mode: 'single-repo',
      gitRootTopology: 'multi-repo-workspace',
      platform: 'codex',
      projectRoot: workspaceRoot,
    }], [{
      exit_code: 0,
      runtime_untrack: { count: 0, reason_code: 'none-tracked' },
    }], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Child repo projections: pending (not covered by this init).');
    expect(output).toContain('spec-first init --codex --all-repos -y');
    expect(output).toContain('spec-first init --codex --repo <child-path> -y');
    expect(output).not.toContain('spec-mcp-setup');
    expect(output).not.toContain('mcp-setup');
  });

  test('does not append the generic runtime setup recommendation after parent-only init', () => {
    const { workspaceRoot } = createWorkspace();
    const result = runInitCli(workspaceRoot, [
      '--codex',
      '-y',
      '-u',
      'Workspace Contract Test',
      '--lang',
      'en',
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Child repo projections: pending (not covered by this init).');
    expect(result.stdout).toContain('spec-first init --codex --all-repos -y');
    expect(result.stdout).not.toContain('For stronger readiness, run `spec-runtime-setup`');
  });

  test('does not add workspace child-projection handoffs to a regular Git repo', () => {
    const { childRoot } = createWorkspace();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    printInitApplySummaries([{
      mode: 'single-repo',
      gitRootTopology: 'single-repo',
      platform: 'codex',
      projectRoot: childRoot,
    }], [{
      exit_code: 0,
      runtime_untrack: { count: 0, reason_code: 'none-tracked' },
    }], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).not.toContain('Child repo projections:');
    expect(output).not.toContain('spec-first init --codex --all-repos -y');
  });

  test('recommends runtime setup only after all child projections are ready', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    printInitApplySummaries([{
      mode: 'all-repos',
      platform: 'codex',
      workspaceRoot,
    }], [{
      exit_code: 0,
      runtime_untrack: { count: 0, reason_code: 'none-tracked' },
      workspace_summary: buildWorkspaceInitSummary({
        workspaceRoot,
        plan: buildCodexWorkspacePlan(workspaceRoot, childRoot),
        parentRuntime: readyParentRuntime(),
        results: [readyChildResult(childRoot)],
      }),
    }], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Child repo projections are ready for Codex. Next: run spec-runtime-setup.');
    expect(output).not.toContain('spec-mcp-setup');
    expect(output).not.toContain('mcp-setup');
  });

  test('recommends the narrow failed child repair before runtime setup for partial all-repos init', () => {
    const { workspaceRoot, childRoot } = createWorkspace();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    printInitApplySummaries([{
      mode: 'all-repos',
      platform: 'codex',
      workspaceRoot,
    }], [{
      exit_code: 1,
      runtime_untrack: { count: 0, reason_code: 'none-tracked' },
      workspace_summary: buildWorkspaceInitSummary({
        workspaceRoot,
        plan: buildCodexWorkspacePlan(workspaceRoot, childRoot),
        parentRuntime: readyParentRuntime(),
        results: [{
          ...readyChildResult(childRoot),
          exit_code: 1,
          overall_status: 'action-required',
          reason_code: 'init-failed',
        }],
      }),
    }], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Child repo projection is incomplete. Repair the affected child first:');
    expect(output).toContain('spec-first init --codex --repo child-app -y');
    expect(output).not.toContain('Next: run spec-runtime-setup.');
    expect(output).not.toContain('spec-mcp-setup');
    expect(output).not.toContain('mcp-setup');
  });
});
