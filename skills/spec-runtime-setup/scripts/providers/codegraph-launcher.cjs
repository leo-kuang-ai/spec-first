'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { assertContainedPath } = require('../lib/path-safety.cjs');
const { readStableRegularFile } = require('../lib/regular-file-snapshot.cjs');

const PACKAGE = '@colbymchenry/codegraph';

// npm shim 的 --version 也可能下载或清理 cache；只把已安装平台包交给真实 runner。
function prepareCodegraphLaunch({ command, args = [], env = process.env, cwd = process.cwd(), platform = process.platform, arch = process.arch } = {}) {
  const unchanged = { ok: true, command, args };
  const basename = path.basename(String(command || '')).toLowerCase();
  if (!['codegraph', 'codegraph.cmd', 'codegraph.exe', 'codegraph.ps1', 'npm-shim.js'].includes(basename)) return unchanged;
  const windows = platform === 'win32' || platform === 'windows';
  const executable = resolveExecutable(command, env, cwd, windows);
  if (!executable) return unchanged;
  try {
    const real = fs.realpathSync(executable);
    let packageRoot;
    if (path.basename(real) === 'npm-shim.js') {
      packageRoot = path.dirname(real);
    } else if (windows && /\.(cmd|ps1)$/i.test(executable)) {
      const directory = path.dirname(executable);
      const candidates = [path.join(directory, 'node_modules', '@colbymchenry', 'codegraph')];
      if (path.basename(directory).toLowerCase() === '.bin') candidates.push(path.join(directory, '..', '@colbymchenry', 'codegraph'));
      // 只识别 npm global prefix 与 local .bin 布局；不解释或执行 wrapper 文本。
      const candidate = candidates.find((root) => fs.existsSync(path.join(root, 'npm-shim.js')));
      if (candidate) packageRoot = fs.realpathSync(candidate);
    }
    if (!packageRoot) return unchanged;
    const manifest = readManifest(packageRoot);
    if (manifest.name !== PACKAGE) return basename === 'npm-shim.js' ? unchanged : blocked('codegraph-package-identity-unverified');
    const dependency = require('../../setup-registry.json').external_dependencies.find((entry) => entry.id === 'codegraph');
    if (!dependency || manifest.version !== dependency.version) return blocked('codegraph-version-pin-mismatch');
    const target = `${windows ? 'win32' : platform}-${arch}`;
    const platformPackage = `${PACKAGE}-${target}`;
    if (manifest.optionalDependencies?.[platformPackage] !== dependency.version) return blocked('codegraph-platform-unsupported');
    const resolve = createRequire(path.join(packageRoot, 'npm-shim.js')).resolve;
    let bundleRoot;
    try { bundleRoot = fs.realpathSync(path.dirname(resolve(`${platformPackage}/package.json`))); } catch (_error) {
      return blocked('codegraph-platform-bundle-missing');
    }
    const bundle = readManifest(bundleRoot);
    if (bundle.name !== platformPackage || bundle.version !== dependency.version) return blocked('codegraph-platform-version-mismatch');
    const executablePath = safeFile(bundleRoot, windows ? 'node.exe' : 'bin/codegraph');
    const prefix = windows
      ? ['--liftoff-only', '--disable-warning=ExperimentalWarning', safeFile(bundleRoot, 'lib/dist/bin/codegraph.js')]
      : [];
    // 仅绑定已解析包元数据与入口路径；不声称验证安装后二进制或传递依赖字节。
    const inventory = [packageRoot, manifest.name, manifest.version, bundleRoot, bundle.name, bundle.version, executablePath, prefix];
    return { ok: true, command: executablePath, args: [...prefix, ...args], provider_identity: {
      package: manifest.name,
      version: manifest.version,
      installer: 'npm',
      command: executablePath,
      inventory_sha256: createHash('sha256').update(JSON.stringify(inventory)).digest('hex'),
    } };
  } catch (_error) {
    return blocked('codegraph-launcher-identity-unavailable');
  }
}

function blocked(reason) {
  return { ok: false, reason_code: reason, next_action: '运行 spec-runtime-setup --only codegraph --installation-only 修复 pinned npm 平台包；setup 不使用 self-heal cache。' };
}

function safeFile(root, relative) {
  const filename = assertContainedPath(root, path.join(root, relative), { reasonCode: 'codegraph-launcher-path-unsafe' });
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('codegraph-launcher-path-unsafe');
  return filename;
}

function readManifest(root) {
  const filename = safeFile(root, 'package.json');
  const result = readStableRegularFile(filename, {
    rootPath: root,
    read: (fd, stat) => {
      if (stat.size > 64 * 1024) throw new Error('codegraph-package-manifest-invalid');
      const bytes = Buffer.alloc(stat.size + 1);
      let offset = 0;
      while (offset < bytes.length) {
        const count = fs.readSync(fd, bytes, offset, bytes.length - offset, offset);
        if (!count) break;
        offset += count;
      }
      if (offset !== stat.size) throw new Error('codegraph-package-manifest-unstable');
      return JSON.parse(bytes.subarray(0, offset).toString('utf8'));
    },
  });
  if (!result.ok) throw new Error('codegraph-package-manifest-unstable');
  return result.value;
}

function resolveExecutable(command, env, cwd, windows) {
  const explicit = path.isAbsolute(command) || command.includes('/') || command.includes('\\');
  const directories = explicit ? [''] : String(env.PATH || env.Path || '').split(windows ? ';' : path.delimiter).filter(Boolean);
  const extensions = windows && !path.extname(command)
    ? String(env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').map((value) => value.toLowerCase()) : [''];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = path.resolve(cwd, directory, `${command}${extension}`);
      try {
        if (!fs.statSync(candidate).isFile()) continue;
        fs.accessSync(candidate, windows ? fs.constants.F_OK : fs.constants.X_OK);
        return candidate;
      } catch (_error) { /* 按 PATH 顺序继续查找，不执行探针。 */ }
    }
  }
  return null;
}

module.exports = { prepareCodegraphLaunch };
