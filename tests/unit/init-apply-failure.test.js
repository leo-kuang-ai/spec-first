'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const initDeveloper = require('../../src/cli/commands/init-developer');
const initOutput = require('../../src/cli/commands/init-output');

function makeGlobalWrite(overrides = {}) {
  const developer = {
    name: 'init-runner',
    lang: 'zh',
    initializedAt: '2026-07-11T00:00:00.000Z',
    version: '1.13.2',
    hosts: ['codex', 'claude'],
    syncUserLanguage: true,
    ...(overrides.developer || {}),
  };
  return {
    action: 'create',
    globalPath: '~/.spec-first/.developer',
    ...overrides,
    developer,
  };
}

function emptyOperationPlan(operations = []) {
  return { operations, summary: {} };
}

function makeProjectPlan(projectRoot, globalDeveloperWrite, overrides = {}) {
  return {
    mode: 'single-repo',
    projectRoot,
    errors: [],
    destructiveResetPlan: null,
    preSyncPlan: emptyOperationPlan(),
    writePlan: emptyOperationPlan([
      {
        kind: 'write_file',
        path: 'project-mutation.txt',
        contents: 'project mutation\n',
      },
    ]),
    globalDeveloperWrite,
    ...overrides,
  };
}

function loadInitApplyWithDeveloper(overrides, stateOverrides = {}) {
  jest.resetModules();
  const developerPath = '../../src/cli/developer';
  const statePath = '../../src/cli/state';
  const actualDeveloper = jest.requireActual(developerPath);
  const actualState = jest.requireActual(statePath);
  jest.doMock(developerPath, () => ({
    ...actualDeveloper,
    ...overrides,
  }));
  jest.doMock(statePath, () => ({
    ...actualState,
    ...stateOverrides,
  }));
  let initApply;
  jest.isolateModules(() => {
    initApply = require('../../src/cli/commands/init-apply');
  });
  jest.dontMock(developerPath);
  jest.dontMock(statePath);
  return initApply;
}

describe('init run-level global developer prerequisite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('canonicalizes nested create plans and keeps the deterministic first initializedAt', () => {
    const first = makeGlobalWrite({
      developer: {
        initializedAt: '2026-07-11T00:00:00.001Z',
        hosts: ['codex', 'claude'],
      },
    });
    const second = makeGlobalWrite({
      developer: {
        initializedAt: '2026-07-11T00:00:00.002Z',
        hosts: ['claude', 'codex'],
      },
    });
    const third = makeGlobalWrite({
      developer: {
        initializedAt: '2026-07-11T00:00:00.003Z',
        hosts: ['codex', 'claude', 'codex'],
      },
    });

    const effective = initDeveloper.resolveEffectiveGlobalDeveloperWrite([
      { mode: 'single-repo', globalDeveloperWrite: first },
      {
        mode: 'all-repos',
        parentPlan: { globalDeveloperWrite: second },
        childPlans: [{ plan: { globalDeveloperWrite: third } }],
      },
    ]);

    expect(effective).toMatchObject({
      action: 'create',
      globalPath: '~/.spec-first/.developer',
      sourcePlanCount: 3,
      developer: {
        initializedAt: '2026-07-11T00:00:00.001Z',
        hosts: ['claude', 'codex'],
      },
    });
  });

  test('fails closed with stable conflict evidence for normalized fields', () => {
    const first = makeGlobalWrite();
    const conflicting = makeGlobalWrite({
      developer: { name: 'different-name' },
    });

    expect(() => initDeveloper.resolveEffectiveGlobalDeveloperWrite([
      { mode: 'single-repo', globalDeveloperWrite: first },
      { mode: 'single-repo', globalDeveloperWrite: conflicting },
    ])).toThrow(expect.objectContaining({
      code: 'global_developer_write_conflict',
      conflictFields: ['name'],
    }));
  });

  test('uses the shared atomic writer for the global developer profile', () => {
    jest.resetModules();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-global-atomic-'));
    const resolvedPath = path.join(home, '.spec-first', '.developer');
    const writeFileAtomic = jest.fn();
    jest.doMock('node:os', () => ({
      ...jest.requireActual('node:os'),
      homedir: () => home,
    }));
    jest.doMock('../../src/cli/atomic-write', () => ({
      ...jest.requireActual('../../src/cli/atomic-write'),
      writeFileAtomic,
    }));
    let developer;
    jest.isolateModules(() => {
      developer = require('../../src/cli/developer');
    });

    developer.writeGlobalDeveloperFile(makeGlobalWrite().developer);

    expect(writeFileAtomic).toHaveBeenCalledTimes(1);
    expect(writeFileAtomic).toHaveBeenCalledWith(
      resolvedPath,
      expect.stringContaining('name=init-runner\n'),
      'utf8',
    );
    jest.dontMock('node:os');
    jest.dontMock('../../src/cli/atomic-write');
  });

  test('preserves writer failure evidence and leaves project/reset operations untouched', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-prerequisite-'));
    const existingRuntimePath = path.join(projectRoot, 'existing-runtime.txt');
    const resolvedPath = path.join(projectRoot, 'blocked-home', '.spec-first', '.developer');
    fs.writeFileSync(existingRuntimePath, 'keep me\n', 'utf8');
    const error = Object.assign(new Error('permission denied by focused test'), { code: 'EACCES' });
    const writer = jest.fn(() => {
      throw error;
    });
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      getGlobalDeveloperPath: () => resolvedPath,
      writeGlobalDeveloperFile: writer,
    });
    const plan = makeProjectPlan(projectRoot, makeGlobalWrite(), {
      destructiveResetPlan: emptyOperationPlan([
        { kind: 'remove_file', path: 'existing-runtime.txt' },
      ]),
    });

    let thrown;
    try {
      applyProjectInitPlan(projectRoot, plan);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBe(error);
    expect(thrown).toMatchObject({ code: 'EACCES', globalDeveloperTargetPath: resolvedPath });
    expect(thrown.message).toContain('permission denied by focused test');
    expect(thrown.message).toContain(resolvedPath);
    expect(writer).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync(existingRuntimePath, 'utf8')).toBe('keep me\n');
    expect(fs.existsSync(path.join(projectRoot, 'project-mutation.txt'))).toBe(false);
  });

  test('programmatic invalid plans stop before both the writer and project operations', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-invalid-'));
    const writer = jest.fn();
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: writer,
    });
    const plan = makeProjectPlan(projectRoot, makeGlobalWrite(), {
      errors: [{ code: 'invalid-test-plan', message: 'invalid test plan' }],
    });

    const result = applyProjectInitPlan(projectRoot, plan);

    expect(result.exit_code).toBe(1);
    expect(writer).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(projectRoot, 'project-mutation.txt'))).toBe(false);
  });

  test('programmatic apply writes the prerequisite once and returns its run-level result', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-programmatic-'));
    const resolvedPath = path.join(projectRoot, 'home', '.spec-first', '.developer');
    const writer = jest.fn();
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      getGlobalDeveloperPath: () => resolvedPath,
      writeGlobalDeveloperFile: writer,
    });

    const result = applyProjectInitPlan(projectRoot, makeProjectPlan(projectRoot, makeGlobalWrite()));

    expect(writer).toHaveBeenCalledTimes(1);
    expect(result.globalDeveloperWriteResult).toMatchObject({
      action: 'create',
      status: 'applied',
      applied: true,
      resolvedPath,
    });
    expect(fs.readFileSync(path.join(projectRoot, 'project-mutation.txt'), 'utf8'))
      .toBe('project mutation\n');
  });

  test('project write failure preserves the applied profile result on the original error', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-project-failure-'));
    const resolvedPath = path.join(projectRoot, 'home', '.spec-first', '.developer');
    const writer = jest.fn();
    const projectError = Object.assign(new Error('project write failed'), { code: 'EIO' });
    const applyOperationPlan = jest.fn()
      .mockReturnValueOnce({})
      .mockImplementationOnce(() => {
        throw projectError;
      });
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      getGlobalDeveloperPath: () => resolvedPath,
      writeGlobalDeveloperFile: writer,
    }, {
      applyOperationPlan,
    });

    let thrown;
    try {
      applyProjectInitPlan(projectRoot, makeProjectPlan(projectRoot, makeGlobalWrite()));
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBe(projectError);
    expect(thrown).toMatchObject({
      code: 'EIO',
      globalDeveloperWriteResult: {
        action: 'create',
        status: 'applied',
        applied: true,
        resolvedPath,
      },
      // 常规路径失败后错误消息追加回滚指引，原始失败原因保持在首行。
      runtimeRollback: 'restored',
    });
    expect(thrown.message).toContain('project write failed');
    expect(thrown.message).toContain('spec-first init 已把受管 runtime 回滚到本次写入前状态');
    expect(writer).toHaveBeenCalledTimes(1);
    expect(applyOperationPlan).toHaveBeenCalledTimes(2);
  });

  test('regular-path partial write failure rolls back pre-existing managed files', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-rollback-'));
    const existingManaged = path.join(projectRoot, 'existing-managed.md');
    const blockedTarget = path.join(projectRoot, 'blocked-target');
    fs.writeFileSync(existingManaged, 'before\n', 'utf8');
    fs.mkdirSync(blockedTarget);
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: jest.fn(),
    });

    let thrown;
    try {
      applyProjectInitPlan(projectRoot, makeProjectPlan(projectRoot, makeGlobalWrite(), {
        writePlan: emptyOperationPlan([
          { kind: 'write_file', path: 'existing-managed.md', contents: 'after\n' },
          // 目录占位使第二个写入以 EISDIR 失败，模拟磁盘/权限类中途失败。
          { kind: 'write_file', path: 'blocked-target', contents: 'never written\n' },
        ]),
      }));
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toMatchObject({ code: 'EISDIR', runtimeRollback: 'restored' });
    // 第一个写入已发生，回滚必须把它恢复到写入前内容。
    expect(fs.readFileSync(existingManaged, 'utf8')).toBe('before\n');
    expect(fs.statSync(blockedTarget).isDirectory()).toBe(true);
    expect(thrown.message).toContain('spec-first init 已把受管 runtime 回滚到本次写入前状态');
  });

  test('write failure rolls back files removed by preSync and preserves the old state manifest', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-presync-'));
    const obsoleteAsset = path.join(projectRoot, 'obsolete-asset.md');
    const stateFile = path.join(projectRoot, 'state.json');
    const blockedTarget = path.join(projectRoot, 'blocked-target');
    fs.writeFileSync(obsoleteAsset, 'obsolete content\n', 'utf8');
    fs.writeFileSync(stateFile, '{"platform":"codex","assets":["obsolete-asset.md"]}\n', 'utf8');
    fs.mkdirSync(blockedTarget);
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: jest.fn(),
    });

    let thrown;
    try {
      applyProjectInitPlan(projectRoot, makeProjectPlan(projectRoot, makeGlobalWrite(), {
        // preSync 删除旧受管资产——这是常规刷新路径中真实存在的删除来源
        //（planObsoleteManagedAssetRemoval 等），回滚必须覆盖它。
        preSyncPlan: emptyOperationPlan([
          { kind: 'remove_file', path: 'obsolete-asset.md' },
        ]),
        writePlan: emptyOperationPlan([
          { kind: 'write_file', path: 'state.json', contents: '{"platform":"codex","assets":[]}\n' },
          { kind: 'write_file', path: 'blocked-target', contents: 'boom\n' },
        ]),
      }));
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toMatchObject({ code: 'EISDIR', runtimeRollback: 'restored' });
    // preSync 删除的资产被恢复。
    expect(fs.readFileSync(obsoleteAsset, 'utf8')).toBe('obsolete content\n');
    // 已写入的新 state 被回滚，旧 manifest 保留——doctor 的漂移检测依赖它。
    expect(fs.readFileSync(stateFile, 'utf8'))
      .toBe('{"platform":"codex","assets":["obsolete-asset.md"]}\n');
  });

  test('destructive reset failure restores files removed by the reset plan', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-destructive-'));
    const legacyAsset = path.join(projectRoot, 'legacy-asset.md');
    const blockedTarget = path.join(projectRoot, 'blocked-target');
    fs.writeFileSync(legacyAsset, 'legacy content\n', 'utf8');
    fs.mkdirSync(blockedTarget);
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: jest.fn(),
    });

    let thrown;
    try {
      applyProjectInitPlan(projectRoot, makeProjectPlan(projectRoot, makeGlobalWrite(), {
        destructiveResetPlan: emptyOperationPlan([
          { kind: 'remove_file', path: 'legacy-asset.md' },
        ]),
        writePlan: emptyOperationPlan([
          { kind: 'write_file', path: 'blocked-target', contents: 'boom\n' },
        ]),
      }));
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toMatchObject({ code: 'EISDIR', runtimeRollback: 'restored' });
    // 破坏性重置删掉的资产在写入失败后同样恢复。
    expect(fs.readFileSync(legacyAsset, 'utf8')).toBe('legacy content\n');
  });

  test('regular-path success removes the rollback backup from tmpdir', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-rollback-ok-'));
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: jest.fn(),
    });
    const mkdtempSpy = jest.spyOn(fs, 'mkdtempSync');

    const result = applyProjectInitPlan(
      projectRoot,
      makeProjectPlan(projectRoot, makeGlobalWrite()),
    );

    expect(result.exit_code).toBe(0);
    expect(fs.readFileSync(path.join(projectRoot, 'project-mutation.txt'), 'utf8'))
      .toBe('project mutation\n');
    const backupDirs = mkdtempSpy.mock.results
      .map((call) => call.value)
      .filter((dir) => path.basename(dir).startsWith('spec-first-init-backup-'));
    // 备份建在 os.tmpdir() 而非 projectRoot；成功路径必须将其删除。
    expect(backupDirs).toHaveLength(1);
    expect(fs.existsSync(backupDirs[0])).toBe(false);
  });

  test.each([
    ['action', makeGlobalWrite({ action: 'delete' }), ['action']],
    ['globalPath', makeGlobalWrite({ globalPath: '  ' }), ['globalPath']],
    ['developer', { action: 'create', globalPath: '~/.spec-first/.developer' }, ['developer']],
  ])('invalid global profile %s fails before writer and project operations', (_label, globalWrite, invalidFields) => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-invalid-profile-'));
    const writer = jest.fn();
    const applyOperationPlan = jest.fn();
    const { applyProjectInitPlan } = loadInitApplyWithDeveloper({
      writeGlobalDeveloperFile: writer,
    }, {
      applyOperationPlan,
    });
    const plan = makeProjectPlan(projectRoot, globalWrite);

    expect(() => applyProjectInitPlan(projectRoot, plan)).toThrow(expect.objectContaining({
      code: 'global_developer_write_invalid',
      invalidFields,
    }));
    expect(writer).not.toHaveBeenCalled();
    expect(applyOperationPlan).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(projectRoot, 'project-mutation.txt'))).toBe(false);
  });

  test('per-plan success output does not repeat the run-level profile result', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-output-'));
    const plan = {
      platform: 'codex',
      projectRoot,
      commandDir: path.join(projectRoot, '.codex', 'commands'),
      developer: makeGlobalWrite().developer,
      globalDeveloperWrite: makeGlobalWrite(),
      syncedAssets: {
        commands: [],
        skills: [],
        workflowSkills: [],
        internalSkills: [],
        agents: [],
        agentSupportFiles: [],
      },
      writePlan: emptyOperationPlan(),
      changelogCreated: false,
      diagnostics: [],
    };

    initOutput.printInitApplySuccess(plan, { exit_code: 0 }, {
      showDiagnostics: false,
      showNextSteps: false,
    });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).not.toContain('全局 developer profile');
  });

  test('prints one compact run-level receipt for a six-host apply', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-output-'));
    const platforms = ['claude', 'codex', 'cursor', 'kiro', 'qoder', 'opencode'];
    const plans = platforms.map((platform) => ({
      platform,
      projectRoot,
      commandDir: path.join(projectRoot, `.${platform}`, 'commands'),
      developer: makeGlobalWrite().developer,
      syncedAssets: {
        commands: platform === 'claude' || platform === 'qoder'
          ? [{ filename: 'spec-plan.md' }]
          : [],
        skills: ['spec-explain'],
        workflowSkills: ['spec-plan'],
        internalSkills: [],
        agents: [],
        agentSupportFiles: [],
      },
      writePlan: platform === 'claude'
        ? emptyOperationPlan([{ reason: 'managed_gitignore_policy' }])
        : emptyOperationPlan(),
      changelogCreated: false,
      diagnostics: [],
    }));
    const results = platforms.map(() => ({ exit_code: 0 }));

    initOutput.printInitApplySummaries(plans, results, {
      lang: 'en',
      globalDeveloperWriteResult: {
        action: 'create',
        status: 'applied',
        resolvedPath: '/home/tester/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
      userLanguageSyncResult: {
        status: 'ready',
        reason_code: 'none',
        operations: [],
      },
    });

    const output = logSpy.mock.calls.flat().join('\n');
    const lines = output.split('\n').filter(Boolean);
    expect(lines.length).toBeLessThanOrEqual(15);
    expect(output).toContain('Init complete: 6/6 hosts ready');
    for (const label of ['Claude Code', 'Codex', 'Cursor', 'Kiro', 'Qoder', 'OpenCode']) {
      expect(output.match(new RegExp(`${label}:`, 'g')) || []).toHaveLength(1);
    }
    expect(output.match(/Global developer profile:/g) || []).toHaveLength(1);
    expect(output.match(/User-level language sync:/g) || []).toHaveLength(1);
    expect(output.match(/selected-host runtime remains Git-visible/g) || []).toHaveLength(1);
    expect(output).toContain('Git index unchanged');
    expect(output).not.toContain('0 agent');
  });

  test('does not label a partial apply as complete and keeps failure evidence', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const plans = ['claude', 'codex'].map((platform) => ({
      platform,
      projectRoot: '/workspace/app',
      commandDir: `/workspace/app/.${platform}/commands`,
      developer: makeGlobalWrite().developer,
      syncedAssets: {
        commands: [],
        skills: [],
        workflowSkills: [],
        internalSkills: [],
        agents: [],
      },
      writePlan: platform === 'codex'
        ? emptyOperationPlan([{ reason: 'managed_gitignore_policy' }])
        : emptyOperationPlan(),
      diagnostics: [],
    }));

    initOutput.printInitApplySummaries(plans, [
      { exit_code: 0 },
      {
        exit_code: 1,
        error: 'managed write failed (permission-denied)',
      },
    ], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Init result: 1/2 hosts ready');
    expect(output).not.toContain('Init complete:');
    expect(output).toContain('Codex: failed');
    expect(output).toContain('managed write failed (permission-denied)');
    expect(output).not.toContain('updated .gitignore managed block');
    expect(output).not.toContain('selected-host runtime remains Git-visible');
  });

  test('keeps all-repos reason codes and diagnostics in the compact failure receipt', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const plan = {
      mode: 'all-repos',
      platform: 'codex',
      diagnostics: [],
    };
    const result = {
      exit_code: 1,
      workspace_summary: {
        counts: { ready: 1, total: 2 },
        reason_code: 'all-repos-partial-or-action-required',
        parent_host_runtime: { exit_code: 0, reason_code: null, diagnostic: '' },
        results: [{
          exit_code: 1,
          reason_code: 'init-exception',
          diagnostic: 'permission denied for child repo',
        }],
      },
    };

    initOutput.printInitApplySummaries([plan], [result], { lang: 'en' });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Init result: 0/1 hosts ready');
    expect(output).toContain('workspace 1/2 ready');
    expect(output).toContain('all-repos-partial-or-action-required');
    expect(output).toContain('init-exception');
    expect(output).toContain('permission denied for child repo');
  });

  test('keeps user-language profile write errors in the compact receipt', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    initOutput.printInitApplySummaries([], [], {
      lang: 'en',
      userLanguageSyncResult: {
        status: 'action-required',
        reason_code: 'user-language-profile-write-failed',
        operations: [],
        profileOperation: {
          globalPath: '~/.spec-first/.developer',
          error: 'permission denied',
        },
      },
    });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('user-language-profile-write-failed');
    expect(output).toContain('profile: ~/.spec-first/.developer · permission denied');
  });
});
