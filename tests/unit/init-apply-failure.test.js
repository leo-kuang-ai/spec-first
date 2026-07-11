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
    untrackDiagnostic: {},
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
      message: 'project write failed',
      globalDeveloperWriteResult: {
        action: 'create',
        status: 'applied',
        applied: true,
        resolvedPath,
      },
    });
    expect(writer).toHaveBeenCalledTimes(1);
    expect(applyOperationPlan).toHaveBeenCalledTimes(2);
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

    initOutput.printInitApplySuccess(plan, {
      exit_code: 0,
      runtime_untrack: { count: 0, reason_code: 'none-tracked' },
    }, {
      showDiagnostics: false,
      showNextSteps: false,
    });

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).not.toContain('全局 developer profile');
  });
});
