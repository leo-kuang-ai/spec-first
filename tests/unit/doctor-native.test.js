'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildNativeDiagnostics,
  CRG_NATIVE_MODULES,
  hostMirrorEnv,
} = require('../../src/cli/native-modules');

const REPO_ROOT = path.join(__dirname, '..', '..');

describe('doctor native diagnostics', () => {
  test('native diagnostics expose CRG status, Node ABI, and Kotlin source-build expectation', () => {
    const diagnostics = buildNativeDiagnostics();
    const kotlin = diagnostics.modules.find((entry) => entry.name === 'tree-sitter-kotlin');

    expect(diagnostics.node.version).toBe(process.version);
    expect(diagnostics.node.abi).toBe(process.versions.modules);
    expect(['ready', 'degraded', 'unavailable']).toContain(diagnostics.crg_status);
    expect(diagnostics.modules.map((entry) => entry.name)).toEqual(CRG_NATIVE_MODULES.map((entry) => entry.name));
    expect(kotlin).toBeDefined();
    expect(kotlin.source_build_expected).toBe(true);
  });

  test('doctor --json includes native_modules matrix', () => {
    const result = spawnSync(process.execPath, [path.join(REPO_ROOT, 'bin', 'spec-first.js'), 'doctor', '--json'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        SPEC_FIRST_VERSION_REMINDER_LATEST: require('../../package.json').version,
      },
      encoding: 'utf8',
      timeout: 15000,
    });

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.native_modules).toBeTruthy();
    expect(payload.native_modules.node.abi).toBe(process.versions.modules);
    expect(payload.native_modules.modules.some((entry) => entry.name === 'better-sqlite3')).toBe(true);
    expect(payload.native_modules.modules.some((entry) => entry.name === 'tree-sitter-kotlin')).toBe(true);
  });

  test('npmmirror repair mode maps to better-sqlite3 prebuild host env', () => {
    expect(hostMirrorEnv('npmmirror')).toEqual({
      npm_config_better_sqlite3_binary_host: 'https://registry.npmmirror.com/-/binary/better-sqlite3',
    });
    expect(hostMirrorEnv(null)).toEqual({});
  });
});
