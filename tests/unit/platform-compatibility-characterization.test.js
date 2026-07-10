'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getGlobalDeveloperPath } = require('../../src/cli/developer');
const {
  applyOperationPlan,
  buildRelativeOperation,
  readState,
} = require('../../src/cli/state');

const repoRoot = path.resolve(__dirname, '..', '..');
const windowsWorkflowPath = path.join(repoRoot, '.github', 'workflows', 'windows-compatibility.yml');
const tempProjects = [];

function tempProject() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-platform-characterization-'));
  tempProjects.push(projectRoot);
  return projectRoot;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe('Phase 5a platform compatibility characterization', () => {
  afterEach(() => {
    for (const projectRoot of tempProjects.splice(0)) {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Windows CI covers supported Node baselines, tests, package validation, and install shims', () => {
    const workflow = fs.readFileSync(windowsWorkflowPath, 'utf8');

    expect(workflow).toContain('runs-on: windows-latest');
    expect(workflow).toContain('node: [20, 22]');
    expect(workflow).toContain('run: npm ci');
    expect(workflow).toContain('run: npm run typecheck');
    expect(workflow).toContain('run: npm test');
    expect(workflow).toContain('run: npm run build');
    expect(workflow).toContain('$packJson = npm pack --json | Out-String');
    expect(workflow).toContain('npm install --global --prefix $prefix $tarball');
    expect(workflow).toContain('shell: cmd');
    expect(workflow).toContain('spec-first.cmd');
  });

  test('managed state rejects UNC-like entries instead of treating them as removable assets', () => {
    const projectRoot = tempProject();
    const adapter = { stateFile: '.spec-first/state.json' };
    writeJson(path.join(projectRoot, adapter.stateFile), {
      manifestVersion: '1.0.0',
      platform: 'test',
      commands: ['\\\\server\\share\\spec-work.md'],
      skills: [],
      workflowSkills: [],
      agents: [],
      agentSupportFiles: [],
    });

    expect(() => readState(projectRoot, adapter)).toThrow(
      /contains unsafe path entry "\\\\server\\share\\spec-work\.md"/,
    );
  });

  test('normalized UNC operations cannot escape the project root', () => {
    const projectRoot = tempProject();
    const operation = buildRelativeOperation(
      'write_file',
      '\\\\server\\share\\outside.txt',
      'platform_characterization',
      { contents: 'must not be written\n' },
    );

    expect(operation.path).toBe('//server/share/outside.txt');
    expect(() => applyOperationPlan(projectRoot, { operations: [operation] })).toThrow(
      /Unsafe operation path outside project root/,
    );
  });

  test('WSL hints do not silently redirect the global developer profile', () => {
    const previous = {
      WSL_DISTRO_NAME: process.env.WSL_DISTRO_NAME,
      WSLENV: process.env.WSLENV,
      SPEC_FIRST_WINDOWS_HOME: process.env.SPEC_FIRST_WINDOWS_HOME,
    };
    const expectedPath = path.join(os.homedir(), '.spec-first', '.developer');

    try {
      process.env.WSL_DISTRO_NAME = 'Ubuntu';
      process.env.WSLENV = 'SPEC_FIRST_WINDOWS_HOME/p';
      process.env.SPEC_FIRST_WINDOWS_HOME = 'C:\\Users\\spec-first-test';

      expect(getGlobalDeveloperPath()).toBe(expectedPath);
      expect(getGlobalDeveloperPath()).not.toContain('spec-first-test');
    } finally {
      restoreEnv('WSL_DISTRO_NAME', previous.WSL_DISTRO_NAME);
      restoreEnv('WSLENV', previous.WSLENV);
      restoreEnv('SPEC_FIRST_WINDOWS_HOME', previous.SPEC_FIRST_WINDOWS_HOME);
    }
  });
});
