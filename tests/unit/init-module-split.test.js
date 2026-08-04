'use strict';

const fs = require('node:fs');
const path = require('node:path');

const init = require('../../src/cli/commands/init');
const initDeveloper = require('../../src/cli/commands/init-developer');
const initOutput = require('../../src/cli/commands/init-output');
const initPlan = require('../../src/cli/commands/init-plan');
const initProjectPlan = require('../../src/cli/commands/init-project-plan');
const initWorkspace = require('../../src/cli/commands/init-workspace');

describe('init module split', () => {
  test('keeps the public init facade contract unchanged', () => {
    expect(Object.keys(init).sort()).toEqual([
      'applyInitPlan',
      'buildInitPlan',
      'buildInitWritePlan',
      'discoverChildGitRepos',
      'findGitRoot',
      'printInitApplySuccess',
      'printInitDryRun',
      'printInitPreview',
      'printWorkspaceInitApplySuccess',
      'runInit',
    ]);

    expect(init.buildInitPlan).toBe(initPlan.buildInitPlan);
    expect(init.buildInitWritePlan).toBe(initPlan.buildInitWritePlan);
    expect(init.discoverChildGitRepos).toBe(initWorkspace.discoverChildGitRepos);
    expect(init.findGitRoot).toBe(initWorkspace.findGitRoot);
    expect(init.printInitApplySuccess).toBe(initOutput.printInitApplySuccess);
    expect(init.printInitDryRun).toBe(initOutput.printInitDryRun);
    expect(init.printInitPreview).toBe(initOutput.printInitPreview);
    expect(init.printWorkspaceInitApplySuccess).toBe(initOutput.printWorkspaceInitApplySuccess);
  });

  test('keeps init.js as a thin orchestration facade', () => {
    const initPath = path.join(__dirname, '..', '..', 'src', 'cli', 'commands', 'init.js');
    const lineCount = fs.readFileSync(initPath, 'utf8').split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(300);
  });

  test('keeps developer profile helpers outside the project planner', () => {
    expect(initProjectPlan.readLegacyProjectDeveloperFiles)
      .toBe(initDeveloper.readLegacyProjectDeveloperFiles);
    expect(initProjectPlan.resolveGlobalDeveloperWriteAction)
      .toBe(initDeveloper.resolveGlobalDeveloperWriteAction);

    const projectPlanSource = fs.readFileSync(
      path.join(__dirname, '..', '..', 'src', 'cli', 'commands', 'init-project-plan.js'),
      'utf8',
    );
    expect(projectPlanSource).not.toContain('LEGACY_PROJECT_DEVELOPER_PATHS');
    expect(projectPlanSource).not.toContain('function resolveGlobalDeveloperWriteAction');
  });

  test('runs the split init path through a host dry-run', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(init.runInit([
        '--cursor',
        '--dry-run',
        '-y',
        '-u',
        'split-contract',
        '--lang',
        'zh',
      ])).resolves.toBe(0);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
