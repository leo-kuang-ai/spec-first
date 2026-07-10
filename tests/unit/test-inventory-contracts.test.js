'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { WORKFLOW_RUNTIME_CONTRACT_TESTS } = require('../../scripts/run-ai-dev-quality-gate');

const repoRoot = path.resolve(__dirname, '../..');
const currentSources = [
  'package.json',
  'README.md',
  'README.zh-CN.md',
  'scripts/run-test-suite.cjs',
  'scripts/run-ai-dev-quality-gate.js',
  'skills/spec-app-consistency-audit/SKILL.md',
  'skills/spec-app-consistency-audit/README.md',
  'skills/spec-app-consistency-audit/references/headless-runner.md',
  'skills/spec-prd/references/evaluation-governance.md',
  'skills/spec-write-tasks/references/task-pack-schema.md',
  'docs/contracts/context-bundle.md',
  'src/cli/contracts/security/secret-deny-patterns.json',
];

function exactTestPaths(content) {
  return [...content.matchAll(/tests\/(?:unit|smoke|integration)\/[A-Za-z0-9._/-]+(?:\.test\.js|\.sh)/g)]
    .map((match) => match[0]);
}

describe('active test inventory', () => {
  test('quality gate paths all exist', () => {
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS.length).toBeGreaterThan(0);
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS.filter((file) => !fs.existsSync(path.join(repoRoot, file))))
      .toEqual([]);
  });

  test('current source does not claim missing exact test paths', () => {
    const missing = [];
    for (const source of currentSources) {
      const content = fs.readFileSync(path.join(repoRoot, source), 'utf8');
      for (const testPath of exactTestPaths(content)) {
        if (!fs.existsSync(path.join(repoRoot, testPath))) missing.push(`${source}: ${testPath}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('runner contains no legacy missing-test skip path', () => {
    const runner = fs.readFileSync(path.join(repoRoot, 'scripts/run-test-suite.cjs'), 'utf8');
    expect(runner).not.toContain('skip missing legacy');
    expect(runner).toContain('Declared test paths are missing');
  });
});
