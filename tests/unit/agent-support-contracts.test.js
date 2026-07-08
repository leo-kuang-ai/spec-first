'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const {
  inspectInstalledAssets,
  listBundledAgentSupportFiles,
  listBundledAgents,
  planBundledAssetSync,
  syncBundledAssets,
} = require('../../src/cli/plugin');
const { buildState } = require('../../src/cli/state');

const REPO_ROOT = path.join(__dirname, '..', '..');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-agent-support-'));
}

function removeDirectoryIfEmpty(dirPath) {
  try {
    fs.rmdirSync(dirPath);
  } catch (error) {
    if (!error || (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY')) {
      throw error;
    }
  }
}

describe('agent support file contracts', () => {
  test('top-level bundled agent source has been retired in favor of skill-local prompts', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'agents'))).toBe(false);
    expect(listBundledAgents()).toEqual([]);
    expect(listBundledAgentSupportFiles()).toEqual([]);
    expect(fs.existsSync(path.join(
      REPO_ROOT,
      'skills/spec-code-review/references/personas/testing-reviewer.md',
    ))).toBe(true);
    expect(fs.existsSync(path.join(
      REPO_ROOT,
      'skills/spec-plan/references/agents/repo-research-analyst.md',
    ))).toBe(true);
  });

  test('bundled agent support files are tracked separately from markdown agents', () => {
    expect(listBundledAgents()).toEqual([]);
    expect(listBundledAgentSupportFiles()).toEqual([]);
  });

  test('buildState preserves agentSupportFiles in managed state', () => {
    const state = buildState('1.5.1', {
      platform: 'claude',
      commands: [{ filename: 'sessions.md' }, { filename: 'work.md' }, { filename: 'sessions.md' }],
      skills: ['spec-doc-review', 'spec-doc-review'],
      workflowSkills: ['spec-code-review', 'spec-plan', 'spec-code-review'],
      agents: ['spec-repo-research-analyst.agent.md', 'spec-repo-research-analyst.agent.md'],
      agentSupportFiles: [],
    });

    expect(state.commands).toEqual(['sessions.md', 'work.md']);
    expect(state.skills).toEqual(['spec-doc-review']);
    expect(state.workflowSkills).toEqual(['spec-code-review', 'spec-plan']);
    expect(state.agents).toEqual(['spec-repo-research-analyst.agent.md']);
    expect(state.agentSupportFiles).toEqual([]);
  });

  test('runtime support traversal ignores local bytecode and OS noise without hiding real drift', () => {
    const projectRoot = makeTempDir();
    const adapter = getAdapter('codex');
    const sourceScriptsDir = path.join(REPO_ROOT, 'skills', 'spec-compound', 'scripts');
    const cacheDir = path.join(sourceScriptsDir, '__pycache__');
    const bytecodePath = path.join(cacheDir, `noise-${process.pid}.pyc`);
    const pyoPath = path.join(cacheDir, `noise-${process.pid}.pyo`);
    const dsStorePath = path.join(sourceScriptsDir, '.DS_Store');

    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(bytecodePath, 'bytecode fixture\n', 'utf8');
      fs.writeFileSync(pyoPath, 'optimized bytecode fixture\n', 'utf8');
      fs.writeFileSync(dsStorePath, 'macOS metadata fixture\n', 'utf8');

      const plan = planBundledAssetSync(projectRoot, adapter);
      const operationPaths = plan.plan.operations.map((operation) => operation.path);
      expect(operationPaths.some((operationPath) => (
        operationPath.includes('__pycache__')
        || operationPath.endsWith('.pyc')
        || operationPath.endsWith('.pyo')
        || operationPath.endsWith('.DS_Store')
      ))).toBe(false);

      syncBundledAssets(projectRoot, adapter);
      expect(fs.existsSync(path.join(projectRoot, '.agents/skills/spec-compound/scripts/__pycache__'))).toBe(false);
      expect(fs.existsSync(path.join(projectRoot, '.agents/skills/spec-compound/scripts/.DS_Store'))).toBe(false);
      expect(inspectInstalledAssets(projectRoot, adapter).skills.drifted).toEqual([]);

      const runtimeSupportPath = path.join(projectRoot, '.agents/skills/spec-work/references/shipping-workflow.md');
      fs.appendFileSync(runtimeSupportPath, '\nlocal drift fixture\n', 'utf8');
      const drifted = inspectInstalledAssets(projectRoot, adapter).skills.drifted.find((entry) => (
        entry.skillName === 'spec-work'
      ));
      expect(drifted.issues).toContain('content_mismatch:references/shipping-workflow.md');
    } finally {
      fs.rmSync(bytecodePath, { force: true });
      fs.rmSync(pyoPath, { force: true });
      fs.rmSync(dsStorePath, { force: true });
      removeDirectoryIfEmpty(cacheDir);
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('bundled markdown agents do not carry trailing whitespace', () => {
    expect(listBundledAgents()).toEqual([]);
  });
});
