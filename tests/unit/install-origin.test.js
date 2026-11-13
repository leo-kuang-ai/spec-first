'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { detectInstallOrigin } = require('../../src/cli/install-origin');
const packageName = require('../../package.json').name;

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-origin-'));
  const globalRoot = path.join(root, 'global', 'node_modules');
  const packageRoot = path.join(globalRoot, packageName);
  const binPath = path.join(packageRoot, 'bin', 'spec-first.js');
  fs.mkdirSync(path.dirname(binPath), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({
    name: packageName,
    bin: { [packageName]: 'bin/spec-first.js' },
  }));
  fs.writeFileSync(binPath, '');
  return { root, globalRoot, packageRoot, binPath };
}

describe('detectInstallOrigin', () => {
  let temp;
  afterEach(() => {
    if (temp) fs.rmSync(temp.root, { recursive: true, force: true });
    temp = null;
  });

  test('confirms the current entry only when its real file matches the global package bin', () => {
    temp = fixture();
    expect(detectInstallOrigin({
      entryPath: temp.binPath,
      packageRoot: temp.packageRoot,
      runNpm: () => ({ status: 0, stdout: `${temp.globalRoot}\n` }),
    })).toMatchObject({ origin: 'npm-global', reason_code: 'current-entry-matches-global-package' });
  });

  test('classifies a local entry separately even when a global copy exists', () => {
    temp = fixture();
    const localEntry = path.join(temp.root, 'checkout', 'bin', 'spec-first.js');
    fs.mkdirSync(path.dirname(localEntry), { recursive: true });
    fs.writeFileSync(localEntry, '');
    expect(detectInstallOrigin({
      entryPath: localEntry,
      runNpm: () => ({ status: 0, stdout: temp.globalRoot }),
    })).toMatchObject({ origin: 'unknown', reason_code: 'current-entry-differs-from-global-package' });
  });

  test('rejects a global package symlink pointing to a checkout', () => {
    temp = fixture();
    const checkout = path.join(temp.root, 'checkout');
    fs.renameSync(temp.packageRoot, checkout);
    fs.symlinkSync(checkout, temp.packageRoot, 'junction');
    expect(detectInstallOrigin({
      entryPath: path.join(checkout, 'bin', 'spec-first.js'),
      runNpm: () => ({ status: 0, stdout: temp.globalRoot }),
    })).toMatchObject({ origin: 'local', reason_code: 'global-package-linked' });
  });

  test.each([
    ['损坏 manifest', '{bad', 'global-package-manifest-invalid'],
    ['错误包身份', JSON.stringify({ name: 'another-package' }), 'global-package-identity-mismatch'],
    ['bin 越界', JSON.stringify({ name: packageName, bin: '../other.js' }), 'global-package-bin-outside-package'],
    ['Windows 绝对 bin', JSON.stringify({ name: packageName, bin: 'C:\\outside.js' }), 'global-package-bin-invalid'],
  ])('%s 保守拒绝', (_label, manifest, reason_code) => {
    temp = fixture();
    fs.writeFileSync(path.join(temp.packageRoot, 'package.json'), manifest);
    expect(detectInstallOrigin({
      entryPath: temp.binPath,
      packageRoot: temp.packageRoot,
      runNpm: () => ({ status: 0, stdout: temp.globalRoot }),
    })).toMatchObject({ origin: 'unknown', reason_code });
  });

  test('入口符号链接允许指向同一正式全局 bin，但 bin 不得逃出包根', () => {
    temp = fixture();
    const shim = path.join(temp.root, 'shim');
    fs.symlinkSync(temp.binPath, shim);
    const options = { entryPath: shim, packageRoot: temp.packageRoot, runNpm: () => ({ status: 0, stdout: temp.globalRoot }) };
    expect(detectInstallOrigin(options).origin).toBe('npm-global');
    const outside = path.join(temp.root, 'outside.js');
    fs.writeFileSync(outside, '');
    fs.unlinkSync(temp.binPath);
    fs.symlinkSync(outside, temp.binPath);
    expect(detectInstallOrigin(options)).toMatchObject({ origin: 'unknown', reason_code: 'global-package-bin-link-outside-package' });
  });

  test('无法解析当前真实入口时不得运行 npm 探测', () => {
    const runNpm = jest.fn();
    expect(detectInstallOrigin({ entryPath: '/missing', realpathSync: () => { throw new Error('unavailable'); }, runNpm }).origin).toBe('unknown');
    expect(runNpm).not.toHaveBeenCalled();
  });

  test('Windows 路径大小写与分隔符归一不混淆本地副本', () => {
    const options = {
      path: path.win32,
      platform: 'win32',
      entryPath: 'C:/NPM/node_modules/spec-first/bin/spec-first.js',
      packageRoot: 'c:/npm/node_modules/spec-first',
      realpathSync: (value) => path.win32.normalize(value),
      existsSync: () => true,
      lstatSync: () => ({ isSymbolicLink: () => false }),
      statSync: () => ({ isFile: () => true }),
      readFileSync: () => JSON.stringify({ name: packageName, bin: 'bin/spec-first.js' }),
      runNpm: () => ({ status: 0, stdout: 'c:\\npm\\node_modules' }),
    };
    expect(detectInstallOrigin(options).origin).toBe('npm-global');
    expect(detectInstallOrigin({ ...options, entryPath: 'C:/checkout/bin/spec-first.js' }).origin).toBe('unknown');
  });

  test('recognizes Claude plugin location without equating it with npm-global', () => {
    expect(detectInstallOrigin({ entryPath: '/home/user/.claude/plugins/spec-first/bin.js', realpathSync: (value) => value }))
      .toMatchObject({ origin: 'claude-plugin' });
  });

  test('uses unknown when npm root or package evidence is unavailable', () => {
    expect(detectInstallOrigin({ entryPath: '/tmp/npx/spec-first/bin.js', realpathSync: (value) => value, runNpm: () => ({ status: 1 }) }))
      .toMatchObject({ origin: 'unknown', reason_code: 'global-npm-root-unavailable' });
  });
});
