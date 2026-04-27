'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');
const PACKAGE_LOCK_PATH = path.join(REPO_ROOT, 'package-lock.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('package install contracts', () => {
  test('CRG native packages do not block global installs', () => {
    const pkg = readJson(PACKAGE_JSON_PATH);
    const lock = readJson(PACKAGE_LOCK_PATH);
    const nativePackages = [
      'better-sqlite3',
      'tree-sitter',
      'tree-sitter-c',
      'tree-sitter-c-sharp',
      'tree-sitter-cpp',
      'tree-sitter-go',
      'tree-sitter-java',
      'tree-sitter-javascript',
      'tree-sitter-kotlin',
      'tree-sitter-objc',
      'tree-sitter-php',
      'tree-sitter-python',
      'tree-sitter-ruby',
      'tree-sitter-rust',
      'tree-sitter-scala',
      'tree-sitter-swift',
      'tree-sitter-typescript',
    ];

    for (const packageName of nativePackages) {
      expect(pkg.dependencies[packageName]).toBeUndefined();
      expect(pkg.optionalDependencies[packageName]).toBeDefined();
      expect(lock.packages[''].dependencies[packageName]).toBeUndefined();
      expect(lock.packages[''].optionalDependencies[packageName]).toBe(pkg.optionalDependencies[packageName]);

      const lockPackage = lock.packages[`node_modules/${packageName}`];
      if (lockPackage && !pkg.optionalDependencies[packageName].startsWith('file:')) {
        expect(lockPackage.optional).toBe(true);
      }
    }
  });

  test('postinstall keeps native repair behind explicit opt-in flags', () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, 'bin', 'postinstall.js'), 'utf8');

    expect(source).toContain('SPEC_FIRST_NATIVE_REPAIR');
    expect(source).toContain('SPEC_FIRST_NATIVE_BUILD_FROM_SOURCE');
    expect(source).not.toContain("NODE_TLS_REJECT_UNAUTHORIZED: '0'");
    expect(source).not.toContain('NODE_TLS_REJECT_UNAUTHORIZED=0');
  });
});
