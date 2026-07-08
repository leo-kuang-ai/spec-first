'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_PATH = path.join(REPO_ROOT, 'docs/contracts/website-sync-contract.md');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const RELEASE_PUBLISH_PATH = path.join(REPO_ROOT, 'scripts/release-publish.cjs');
const WEBSITE_SYNC_SCRIPT_PATH = path.join(REPO_ROOT, 'scripts/check-website-sync.cjs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

describe('website sync release contract', () => {
  test('documents source truth, external website consumer, and release gate boundary', () => {
    const contract = read(CONTRACT_PATH);

    expect(contract).toContain('官网是本仓库的外部 consumer');
    expect(contract).toContain('package 仓库拥有这些事实');
    expect(contract).toContain('SPEC_FIRST_WEBSITE_REPO');
    expect(contract).toContain('npm run facts:sync');
    expect(contract).toContain('npm run content:audit');
    expect(contract).toContain('npm run test:release:website');
    expect(contract).toContain('不把官网 source vendor 到 package 仓库');
  });

  test('publish flow includes the required website release gate without folding it into ordinary release tests', () => {
    const pkg = JSON.parse(read(PACKAGE_JSON_PATH));
    const publisher = read(RELEASE_PUBLISH_PATH);

    expect(pkg.scripts['test:release']).toBe('node scripts/run-test-suite.cjs release');
    expect(pkg.scripts['test:release:website']).toBe('node scripts/check-website-sync.cjs --required');
    expect(publisher).toContain("runNpmChecked(['run', 'test:release:website'])");
  });

  test('website sync script runs npm content audit directly', () => {
    const script = read(WEBSITE_SYNC_SCRIPT_PATH);

    expect(script).toContain("runNpmChecked(['run', 'content:audit']");
    expect(script).toContain("spawnSync('npm', args");
  });

  test('website sync script runs content audit with the package repo as SPEC_FIRST_SOURCE_DIR', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-website-sync-'));
    const websiteRepo = path.join(tempDir, 'spec-first-official-website');
    const websitePackage = path.join(websiteRepo, 'website');
    const envProbe = path.join(tempDir, 'source-dir.txt');

    write(path.join(websitePackage, 'package.json'), JSON.stringify({
      scripts: {
        'facts:sync': 'node scripts/sync-spec-first-facts.js',
        'content:audit': 'node scripts/audit-content-facts.js',
      },
    }, null, 2));
    write(path.join(websitePackage, 'scripts/sync-spec-first-facts.js'), 'process.exit(0);\n');
    write(
      path.join(websitePackage, 'scripts/audit-content-facts.js'),
      `require('node:fs').writeFileSync(${JSON.stringify(envProbe)}, process.env.SPEC_FIRST_SOURCE_DIR || '');\n`,
    );

    const result = spawnSync(process.execPath, [WEBSITE_SYNC_SCRIPT_PATH, '--required'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        SPEC_FIRST_WEBSITE_REPO: websiteRepo,
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(read(envProbe)).toBe(REPO_ROOT);
    expect(result.stdout).toContain('website sync gate passed');
  });

  test('website sync script fails closed when required checkout is missing', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-website-missing-'));
    const result = spawnSync(process.execPath, [WEBSITE_SYNC_SCRIPT_PATH, '--required'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        SPEC_FIRST_WEBSITE_REPO: path.join(tempDir, 'missing'),
      },
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('official website repo not found');
  });
});
