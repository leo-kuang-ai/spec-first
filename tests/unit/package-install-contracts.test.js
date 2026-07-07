'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const PACKAGE_LOCK_PATH = path.join(REPO_ROOT, 'package-lock.json');
const NPM_IGNORE_PATH = path.join(REPO_ROOT, '.npmignore');
const BIN_PATH = path.join(REPO_ROOT, 'bin/spec-first.js');
const NODE_VERSION_PATH = path.join(REPO_ROOT, 'src/cli/node-version.js');
const TYPECHECK_SCRIPT_PATH = path.join(REPO_ROOT, 'scripts/typecheck-js.js');
const RUN_TEST_SUITE_SCRIPT_PATH = path.join(REPO_ROOT, 'scripts/run-test-suite.cjs');
const README_PATH = path.join(REPO_ROOT, 'README.md');

function walkFiles(rootDir) {
  const results = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__pycache__') {
        continue;
      }
      results.push(...walkFiles(absolutePath));
    } else if (entry.isFile()) {
      results.push(absolutePath);
    }
  }
  return results;
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('package install contracts', () => {
  test('package manifest ships current docs without native parser dependencies', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const lock = readJson(PACKAGE_LOCK_PATH);
    const sqliteDep = 'better-sqlite3';
    const parserDep = 'tree-sitter';
    const nativePackages = [
      sqliteDep,
      parserDep,
      `${parserDep}-c`,
      `${parserDep}-c-sharp`,
      `${parserDep}-cpp`,
      `${parserDep}-go`,
      `${parserDep}-java`,
      `${parserDep}-javascript`,
      `${parserDep}-kotlin`,
      `${parserDep}-objc`,
      `${parserDep}-php`,
      `${parserDep}-python`,
      `${parserDep}-ruby`,
      `${parserDep}-rust`,
      `${parserDep}-scala`,
      `${parserDep}-swift`,
      `${parserDep}-typescript`,
    ];

    for (const packageName of nativePackages) {
      expect(pkg.dependencies?.[packageName]).toBeUndefined();
      expect(pkg.optionalDependencies?.[packageName]).toBeUndefined();
      expect(lock.packages[''].dependencies?.[packageName]).toBeUndefined();
      expect(lock.packages[''].optionalDependencies?.[packageName]).toBeUndefined();
      expect(lock.packages[`node_modules/${packageName}`]).toBeUndefined();
    }

    expect(pkg.files).not.toContain('vendor/');
    expect(pkg.files).toContain('docs/catalog/runtime-capabilities.md');
    expect(pkg.files).toContain('docs/contracts/ai-coding-harness.md');
    expect(pkg.files).toContain('docs/contracts/artifact-summary.md');
    expect(pkg.files).toContain('docs/contracts/context-bundle.md');
    expect(pkg.files).toContain('docs/contracts/context-governance.md');
    expect(pkg.files).toContain('docs/contracts/provider-tools-registry.schema.json');
    expect(pkg.files).toContain('docs/contracts/knowledge/');
    expect(pkg.files).toContain('docs/contracts/quality-gates/');
    expect(pkg.files).toContain('docs/contracts/release-package-evidence.schema.json');
    expect(pkg.files).toContain('docs/contracts/verifiers/');
    expect(pkg.files).toContain('docs/contracts/website-sync-contract.md');
    expect(pkg.files).toContain('docs/contracts/workflows/');
    expect(pkg.files).toContain('scripts/check-release-continuity.cjs');
    expect(pkg.files).toContain('scripts/check-website-sync.cjs');
    expect(pkg.files).toContain('scripts/generate-runtime-capability-catalog.js');
    expect(pkg.files).toContain('scripts/lint-skill-entrypoints.config.json');
    expect(pkg.files).toContain('scripts/lint-skill-entrypoints.js');
    expect(pkg.files).toContain('scripts/npm-install-matrix-smoke.js');
    expect(pkg.files).toContain('scripts/release-publish.cjs');
    expect(pkg.files).toContain('scripts/run-ai-dev-benchmark-fixtures.js');
    expect(pkg.files).toContain('scripts/run-ai-dev-quality-gate.js');
    expect(pkg.files).toContain('scripts/run-test-suite.cjs');
    expect(pkg.files).toContain('scripts/typecheck-js.js');
    expect(pkg.files).toContain('tests/fixtures/ai-dev-benchmarks/');
    expect(pkg.files).toContain('!skills/**/__pycache__/**');
    expect(pkg.files).toContain('!skills/**/*.pyc');
    expect(pkg.files).toContain('!skills/**/*.pyo');
    expect(pkg.overrides).toBeUndefined();

  });

  test('package manifest does not declare install-time lifecycle scripts', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const lock = readJson(PACKAGE_LOCK_PATH);
    const installLifecycleScripts = ['preinstall', 'install', 'postinstall', 'prepare'];

    for (const scriptName of installLifecycleScripts) {
      expect(pkg.scripts[scriptName]).toBeUndefined();
    }
    expect(lock.packages[''].hasInstallScript).toBeUndefined();
  });

  test('published package includes package-script entrypoint files', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const files = new Set(pkg.files);
    const packageScriptEntrypoints = Object.values(pkg.scripts)
      .map((script) => script.match(/^node (scripts\/[^ ]+)/))
      .filter(Boolean)
      .map((match) => match[1]);
    const missingEntrypoints = packageScriptEntrypoints
      .filter((entrypoint) => !files.has(entrypoint));

    expect(missingEntrypoints).toEqual([]);
  });

  test('package ignore excludes generated Python bytecode caches', () => {
    const npmIgnore = fs.readFileSync(NPM_IGNORE_PATH, 'utf8');

    expect(npmIgnore).toContain('__pycache__/');
    expect(npmIgnore).toContain('*.pyc');
    expect(npmIgnore).toContain('*.pyo');
  });

  test('published README uses absolute repository links instead of bundling docs payload', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const readme = fs.readFileSync(README_PATH, 'utf8');

    expect(pkg.files).toContain('README.md');
    expect(pkg.files).not.toContain('README.zh-CN.md');
    expect(pkg.files).not.toContain('docs/assets/readme/');
    expect(pkg.files).not.toContain('docs/05-用户手册/');
    expect(readme).toContain('https://raw.githubusercontent.com/sunrain520/spec-first/main/docs/assets/readme/spec-first-cli-workflow-demo.svg');
    expect(readme).toContain('https://github.com/sunrain520/spec-first/blob/main/README.zh-CN.md');
    expect(readme).toContain('https://github.com/sunrain520/spec-first/blob/main/docs/05-%E7%94%A8%E6%88%B7%E6%89%8B%E5%86%8C/README.md');
    expect(readme).not.toMatch(/\]\(\.\/|\]\(\.\.\//);
    expect(readme).not.toMatch(/!\[[^\]]*\]\(\.\/|!\[[^\]]*\]\(\.\.\//);
  });

  test('npm pack dry-run includes referenced workflow contracts and excludes generated Python bytecode caches', () => {
    const cacheDir = path.join(REPO_ROOT, 'skills/spec-release-notes/scripts/__pycache__');
    const bytecodePath = path.join(cacheDir, `pack-contract-${process.pid}-${Date.now()}.cpython-311.pyc`);
    const npmCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-npm-pack-'));

    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(bytecodePath, 'generated bytecode fixture', 'utf8');

    try {
      const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          npm_config_cache: npmCacheDir,
        },
      });

      expect(result.status).toBe(0);
      const [packResult] = JSON.parse(result.stdout);
      const packedPaths = packResult.files.map((file) => file.path);
      const bytecodePaths = packedPaths.filter((filePath) => (
        filePath.includes('/__pycache__/') || /\.py[co]$/.test(filePath)
      ));

      expect(packedPaths).toContain('docs/contracts/ai-coding-harness.md');
      expect(packedPaths).toContain('docs/contracts/artifact-summary.md');
      expect(packedPaths).toContain('docs/contracts/context-bundle.md');
      expect(packedPaths).toContain('docs/contracts/knowledge/knowledge-harness.md');
      expect(packedPaths).toContain('docs/contracts/provider-tools-registry.schema.json');
      expect(packedPaths).toContain('docs/contracts/workflows/review-finding.md');
      expect(packedPaths).toContain('docs/contracts/context-governance.md');
      const retiredContractPath = ['docs/contracts', 'team-standards.md'].join('/');
      const retiredStandardsRoot = ['docs', 'standards'].join('/');
      const retiredChecker = ['scripts', ['check-team', 'standards.js'].join('-')].join('/');

      expect(packedPaths).not.toContain(retiredContractPath);
      expect(packedPaths).not.toContain(`${retiredStandardsRoot}/index.md`);
      expect(packedPaths).not.toContain(`${retiredStandardsRoot}/shared.md`);
      expect(packedPaths).not.toContain(`${retiredStandardsRoot}/candidates/README.md`);
      expect(packedPaths).not.toContain(retiredChecker);
      expect(packedPaths).toContain('skills/spec-prd/references/evidence-and-topology.md');
      expect(packedPaths).toContain('skills/spec-prd/references/prd-output-template.md');
      expect(packedPaths).toContain('skills/spec-prd/references/prd-readiness-lens.md');
      expect(packedPaths).toContain('skills/spec-prd/references/domain-language-and-decision-ledger.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/00-通用增量需求模板.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/10-App客户端需求模板.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/20-Admin中后台需求模板.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/30-Backend中台服务需求模板.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/README.md');
      expect(packedPaths).not.toContain('skills/spec-prd/templates/standard/90-证券行业需求关注点与参考附录.md');
      expect(bytecodePaths).toEqual([]);
    } finally {
      fs.rmSync(bytecodePath, { force: true });
      fs.rmSync(npmCacheDir, { recursive: true, force: true });
      removeDirectoryIfEmpty(cacheDir);
    }
  });

  test('executable script files declare an interpreter shebang', () => {
    const scriptRoots = ['bin', 'scripts', 'skills']
      .map((root) => path.join(REPO_ROOT, root))
      .filter((root) => fs.existsSync(root));
    const scriptFiles = scriptRoots.flatMap(walkFiles).filter((filePath) => {
      const relativePath = path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
      return (
        relativePath.startsWith('bin/')
        || relativePath.startsWith('scripts/')
        || relativePath.includes('/scripts/')
      );
    });
    const executableWithoutShebang = scriptFiles.filter((filePath) => {
      const mode = fs.statSync(filePath).mode;
      if ((mode & 0o111) === 0) {
        return false;
      }
      const firstLine = fs.readFileSync(filePath, 'utf8').split(/\r?\n/, 1)[0];
      return !firstLine.startsWith('#!');
    }).map((filePath) => path.relative(REPO_ROOT, filePath).split(path.sep).join('/'));

    expect(executableWithoutShebang).toEqual([]);
  });

  test('bin enforces Node 20 runtime before loading CLI code', () => {
    const bin = fs.readFileSync(BIN_PATH, 'utf8');
    const nodeVersion = require(NODE_VERSION_PATH);

    expect(nodeVersion.MINIMUM_NODE_MAJOR).toBe(20);
    expect(nodeVersion.isSupportedNodeVersion('v19.9.0')).toBe(false);
    expect(nodeVersion.isSupportedNodeVersion('v20.0.0')).toBe(true);
    expect(nodeVersion.isSupportedNodeVersion('v24.1.0')).toBe(true);
    expect(nodeVersion.formatUnsupportedNodeMessage('v18.19.0')).toContain('Node.js >=20.0.0');
    expect(bin.indexOf("require('../src/cli/node-version')")).toBeLessThan(bin.indexOf("require('../src/cli')"));
  });

  test('typecheck script covers packaged JavaScript source directories', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const typecheckSource = fs.readFileSync(TYPECHECK_SCRIPT_PATH, 'utf8');

    expect(pkg.scripts.typecheck).toBe('node scripts/typecheck-js.js');
    expect(typecheckSource).toContain("const CHECK_ROOTS = ['bin', 'src', 'scripts', 'skills']");
    expect(typecheckSource).toContain("new Set(['.cjs', '.js'])");

    const result = spawnSync(process.execPath, [TYPECHECK_SCRIPT_PATH], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('typecheck passed');
  });

  test('npm lifecycle test scripts avoid direct POSIX shell entrypoints', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const runnerSource = fs.readFileSync(RUN_TEST_SUITE_SCRIPT_PATH, 'utf8');
    const scriptNames = [
      'test',
      'test:unit',
      'test:mcp-setup',
      'test:smoke',
      'test:integration',
      'test:release',
      'test:release:governance',
      'test:release:install',
    ];

    for (const scriptName of scriptNames) {
      expect(pkg.scripts[scriptName]).toMatch(/^node scripts\/run-test-suite\.cjs( |$)/);
      expect(pkg.scripts[scriptName]).not.toMatch(/\bbash\b|\bnpx\b|&&|\|\|/);
    }

    expect(runnerSource).toContain("process.platform === 'win32'");
    expect(runnerSource).toContain('SPEC_FIRST_FORCE_POSIX_TESTS');
    expect(runnerSource).toContain('skip POSIX shell test on native Windows');
    expect(runnerSource).toContain("runNode(['scripts/npm-install-matrix-smoke.js'])");
    expect(runnerSource).toContain("node_modules', 'jest', 'bin', 'jest.js'");
    expect(runnerSource).toContain('shell: false');
  });
});
