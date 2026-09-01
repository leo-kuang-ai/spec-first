'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('required CI producers', () => {
  test('ai-dev-gate runs for every pull request with the stable required-check name', () => {
    const workflow = read('.github/workflows/ai-dev-quality-gate.yml');
    expect(workflow).toContain('pull_request:');
    expect(workflow).not.toContain('paths:');
    expect(workflow).toContain('name: ai-dev-gate');
    expect(workflow).toContain('run: npm run test:ai-dev:gate');
  });

  test('lint-skill-entrypoints runs for every pull request with the stable required-check name', () => {
    const workflow = read('.github/workflows/skill-entrypoint-gate.yml');
    expect(workflow).toContain('pull_request:');
    expect(workflow).not.toContain('paths:');
    expect(workflow).toContain('name: lint-skill-entrypoints');
    expect(workflow).toContain('run: npm run lint:skill-entrypoints');
    expect(workflow).toContain('run: npm run test:eval-fixtures');
    expect(workflow).toContain('run: npm run test:release:governance');
  });

  test('npm install matrix covers all supported CI operating systems and current Node baselines', () => {
    const workflow = read('.github/workflows/npm-install-matrix.yml');
    expect(workflow).toContain('pull_request:');
    expect(workflow).not.toContain('paths:');
    expect(workflow).toContain('os: [ubuntu-latest, macos-latest, windows-latest]');
    expect(workflow).toContain('node: [20, 22, 24]');
    expect(workflow).toContain('run: node scripts/npm-install-matrix-smoke.cjs');
    expect(read('README.md')).toContain('actions/workflows/npm-install-matrix.yml');
    expect(read('README.en.md')).toContain('actions/workflows/npm-install-matrix.yml');
    expect(read('README.zh-CN.md')).toContain('actions/workflows/npm-install-matrix.yml');
  });

  test('release publishing uses the shared npm CLI resolver instead of shell command lookup', () => {
    const releaseConsumers = [
      'scripts/release-publish.cjs',
      'scripts/check-release-continuity.cjs',
      'scripts/check-website-sync.cjs',
    ];
    const packageJson = JSON.parse(read('package.json'));
    for (const consumer of releaseConsumers) {
      const source = read(consumer);
      expect(source).toContain("require('./lib/npm-cli.cjs')");
      expect(source).not.toMatch(/spawnSync\(['"]npm/);
    }
    expect(packageJson.files).toContain('scripts/lib/npm-cli.cjs');
    // release-publish 的 git 门禁模块同样随包分发，缺失会让 tarball 内的
    // release-publish.cjs 在 require 时崩溃。
    expect(packageJson.files).toContain('scripts/lib/release-git.cjs');
    expect(read('scripts/release-publish.cjs')).toContain("require('./lib/release-git.cjs')");
  });
});
