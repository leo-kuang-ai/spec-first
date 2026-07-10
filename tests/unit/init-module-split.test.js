'use strict';

const fs = require('node:fs');
const path = require('node:path');

const init = require('../../src/cli/commands/init');
const initOutput = require('../../src/cli/commands/init-output');
const initPlan = require('../../src/cli/commands/init-plan');
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
});
