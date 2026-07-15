'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { WORKFLOW_RUNTIME_CONTRACT_TESTS } = require('../../scripts/run-ai-dev-quality-gate');

const repoRoot = path.resolve(__dirname, '../..');
const sourceExtensions = new Set(['.cjs', '.js', '.json', '.md', '.yaml']);

function collectSourceFiles(relativePath, found = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(absolutePath)) {
      collectSourceFiles(path.join(relativePath, name), found);
    }
  } else if (sourceExtensions.has(path.extname(relativePath))) {
    found.push(relativePath);
  }
  return found;
}

const currentSources = [
  'package.json',
  'README.md',
  'README.zh-CN.md',
  ...collectSourceFiles('scripts'),
  ...collectSourceFiles('src'),
  ...collectSourceFiles('skills'),
  ...collectSourceFiles('docs/contracts'),
  ...collectSourceFiles('docs/catalog'),
];

function exactTestPaths(content) {
  return [...content.matchAll(/tests\/(?:unit|smoke|integration)\/[A-Za-z0-9._/-]+(?:\.test\.js|\.sh)/g)]
    .map((match) => match[0]);
}

describe('active test inventory', () => {
  test('package scripts and publish entries do not reference missing local files', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const commandPaths = Object.values(packageJson.scripts || {}).flatMap((command) =>
      [...command.matchAll(/(?:scripts|tests)\/[A-Za-z0-9._/-]+\.(?:cjs|js|sh)/g)].map((match) => match[0]));
    expect(commandPaths.filter((file) => !fs.existsSync(path.join(repoRoot, file)))).toEqual([]);

    const explicitPublishFiles = (packageJson.files || [])
      .filter((entry) => !entry.startsWith('!') && /\.[A-Za-z0-9]+$/.test(entry));
    expect(explicitPublishFiles.filter((file) => !fs.existsSync(path.join(repoRoot, file)))).toEqual([]);
  });

  test('quality gate paths all exist', () => {
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS.length).toBeGreaterThan(0);
    for (const lifecycleTest of [
      'tests/unit/plan-status-helper.test.js',
      'tests/unit/plans-command.test.js',
      'tests/unit/requirements-rendering-parity.test.js',
      'tests/unit/spec-brainstorm-contracts.test.js',
      'tests/unit/spec-lfg-contracts.test.js',
      'tests/integration/plan-status-closeout.integration.test.js',
    ]) {
      expect(WORKFLOW_RUNTIME_CONTRACT_TESTS).toContain(lifecycleTest);
    }
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
    expect(runner).toContain('声明的测试路径不存在');
  });
});
