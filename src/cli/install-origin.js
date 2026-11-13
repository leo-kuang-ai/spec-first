'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../../package.json');
const { runNpm } = require('../../scripts/lib/npm-cli.cjs');

function isWithin(root, target, pathApi) {
  const relative = pathApi.relative(root, target);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${pathApi.sep}`) && !pathApi.isAbsolute(relative));
}

function resolvePackageCliFromGlobalRoot(globalRoot, options = {}) {
  const pathApi = options.path || path;
  const io = { ...fs, ...options };
  const fail = (reason_code) => ({ ok: false, cliPath: null, reason_code });
  if (!pathApi.isAbsolute(globalRoot)) return fail('global-npm-root-invalid');
  const packageRoot = pathApi.resolve(globalRoot, ...pkg.name.split('/'));
  const manifestPath = pathApi.join(packageRoot, 'package.json');
  try {
    if (!io.existsSync(manifestPath)) return fail('global-package-manifest-missing');
    let manifest;
    try {
      manifest = JSON.parse(io.readFileSync(manifestPath, 'utf8'));
    } catch {
      return fail('global-package-manifest-invalid');
    }
    if (!manifest || manifest.name !== pkg.name) return fail('global-package-identity-mismatch');
    const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin && manifest.bin[pkg.name];
    if (typeof bin !== 'string' || !bin || pathApi.isAbsolute(bin) || path.win32.isAbsolute(bin)) {
      return fail('global-package-bin-invalid');
    }
    const cliPath = pathApi.resolve(packageRoot, bin);
    if (!isWithin(packageRoot, cliPath, pathApi)) return fail('global-package-bin-outside-package');
    if (io.lstatSync(packageRoot).isSymbolicLink()) return fail('global-package-linked');
    const realRoot = io.realpathSync(packageRoot);
    const realGlobalRoot = io.realpathSync(globalRoot);
    if (pathApi.relative(pathApi.join(realGlobalRoot, ...pkg.name.split('/')), realRoot) !== '') {
      return fail('global-package-linked');
    }
    if (!io.existsSync(cliPath)) return fail('global-package-bin-missing');
    if (!io.statSync(cliPath).isFile()) return fail('global-package-bin-not-file');
    const realCli = io.realpathSync(cliPath);
    if (!isWithin(realRoot, realCli, pathApi)) return fail('global-package-bin-link-outside-package');
    return { ok: true, cliPath: realCli, packageRoot: realRoot, globalRoot: realGlobalRoot, reason_code: 'global-package-cli-resolved' };
  } catch {
    return fail('global-package-evidence-unavailable');
  }
}

function resolveInstalledCliPath(options = {}) {
  try {
    const response = (options.runNpm || runNpm)(['root', '-g'], { encoding: 'utf8', timeout: 2000 });
    if (!response || response.error || response.status !== 0) {
      return { ok: false, cliPath: null, reason_code: 'global-npm-root-unavailable' };
    }
    const root = String(response.stdout || '').trim();
    if (!root) return { ok: false, cliPath: null, reason_code: 'global-npm-root-empty' };
    return resolvePackageCliFromGlobalRoot(root, options);
  } catch {
    return { ok: false, cliPath: null, reason_code: 'global-npm-root-unavailable' };
  }
}

function detectInstallOrigin(options = {}) {
  const entryPath = options.entryPath || options.selfPath || process.argv[1] || '';
  const pathApi = options.path || path;
  const realpathSync = options.realpathSync || fs.realpathSync;
  const result = (origin, reason_code, extra = {}) => ({ origin, reason_code, ...extra });
  if (!entryPath) return result('unknown', 'current-entry-unavailable');
  let realEntry;
  try {
    realEntry = realpathSync(entryPath);
  } catch {
    return result('unknown', 'current-entry-unavailable');
  }
  const normalized = realEntry.replace(/\\/g, '/');
  const pluginPath = (options.platform || process.platform) === 'win32' ? normalized.toLowerCase() : normalized;
  if (pluginPath.includes('/.claude/plugins/')) return result('claude-plugin', 'claude-plugin-entry');
  const globalCli = resolveInstalledCliPath(options);
  if (!globalCli.ok) {
    return result(globalCli.reason_code === 'global-package-linked' ? 'local' : 'unknown', globalCli.reason_code);
  }
  if (pathApi.relative(realEntry, globalCli.cliPath) !== '') {
    return result('unknown', 'current-entry-differs-from-global-package');
  }
  // 当前模块必须也来自该包，不能由本地代码借用另一份全局入口取得升级资格。
  let currentPackageRoot;
  try {
    currentPackageRoot = realpathSync(options.packageRoot || path.resolve(__dirname, '../..'));
  } catch {
    return result('unknown', 'current-package-unavailable');
  }
  if (pathApi.relative(currentPackageRoot, globalCli.packageRoot) !== '') {
    return result('unknown', 'current-package-differs-from-global-package');
  }
  return result('npm-global', 'current-entry-matches-global-package', { packageRoot: globalCli.packageRoot });
}

module.exports = { detectInstallOrigin, resolveInstalledCliPath, resolvePackageCliFromGlobalRoot };
