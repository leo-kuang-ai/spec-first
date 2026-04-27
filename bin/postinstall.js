#!/usr/bin/env node

const path = require('node:path');
const pkg = require('../package.json');
const { execFileSync, spawnSync } = require('node:child_process');
const { buildNativeDiagnostics, formatNativeSummary, hostMirrorEnv, windowsBuildToolsHint } = require('../src/cli/native-modules');

const ver = `spec-first v${pkg.version}`;
const LINE = '─'.repeat(50);

process.stdout.write(`
┌${LINE}┐
│  ${ver.padEnd(48)}│
│  安装完成                                      │
└${LINE}┘

  下一步：spec-first doctor
  详情：  spec-first -v

`);

// 裁剪非当前平台的 native prebuild 和构建产物
try {
  const script = require.resolve('./prune-native.js');
  const stderr = execFileSync(process.execPath, [script], {
    timeout: 15000,
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
  });
  if (stderr) process.stderr.write(stderr);
} catch (_) {
  // 裁剪失败不影响安装
}

// 检查 CRG 原生模块。默认只探测和提示；耗时编译/镜像下载必须显式 opt-in。
try {
  checkCrgNativeModules();
} catch (_) {
  // native 探测失败不影响主安装流程（postinstall 失败会导致整体安装报错）
}

function probeBetterSqlite() {
  try { require('better-sqlite3'); return true; } catch (_) { return false; }
}

function findBetterSqliteDir() {
  try {
    return path.dirname(require.resolve('better-sqlite3/package.json'));
  } catch (_) { return null; }
}

function findPrebuildInstallBin(sqliteDir) {
  const searchPaths = [
    sqliteDir,
    sqliteDir ? path.join(sqliteDir, 'node_modules') : null,
    path.join(__dirname, '..', 'node_modules'),
    __dirname,
  ].filter(Boolean);
  try {
    return require.resolve('prebuild-install/bin.js', { paths: searchPaths });
  } catch (_) { return null; }
}

function repairCrgNativeModule() {
  if (probeBetterSqlite()) return;

  const sqliteDir = findBetterSqliteDir();
  if (!sqliteDir) {
    showCrgHint();
    return;
  }

  process.stdout.write('  正在修复 CRG 原生模块 (better-sqlite3)...\n');

  // Strategy 1: prebuild-install（可通过 SPEC_FIRST_NATIVE_MIRROR=npmmirror 选择国内镜像）
  const prebuildBin = findPrebuildInstallBin(sqliteDir);
  if (prebuildBin) {
    const r1 = spawnSync(process.execPath, [prebuildBin, '--tag-prefix', 'v'], {
      cwd: sqliteDir,
      env: { ...process.env, ...hostMirrorEnv(process.env.SPEC_FIRST_NATIVE_MIRROR) },
      timeout: 60000,
      encoding: 'utf8',
    });
    if (r1.status === 0 && probeBetterSqlite()) {
      process.stdout.write('  CRG 原生模块修复成功 (预编译包)\n\n');
      return;
    }
  }

  if (process.env.SPEC_FIRST_NATIVE_BUILD_FROM_SOURCE !== '1') {
    showCrgHint();
    return;
  }

  // Strategy 2: node-gyp rebuild（需要 C++ 编译环境，必须显式 opt-in）
  const r2 = spawnSync('node-gyp', ['rebuild', '--release'], {
    cwd: sqliteDir,
    timeout: 120000,
    encoding: 'utf8',
    shell: true,
  });
  if (r2.status === 0 && probeBetterSqlite()) {
    process.stdout.write('  CRG 原生模块修复成功 (从源码编译)\n\n');
    return;
  }

  showCrgHint();
}

function checkCrgNativeModules() {
  const diagnostics = buildNativeDiagnostics();
  if (diagnostics.crg_status === 'ready') return;

  process.stdout.write(
    `  注意: CRG 原生模块状态 ${formatNativeSummary(diagnostics)}\n` +
    `  spec-first init / doctor / clean 正常；CRG 可能降级或暂不可用\n`
  );

  const hint = windowsBuildToolsHint();
  if (hint) {
    process.stdout.write(`  Windows: ${hint}\n`);
  }

  if (process.env.SPEC_FIRST_NATIVE_REPAIR === '1') {
    repairCrgNativeModule();
    return;
  }

  process.stdout.write(
    `  如需重试 native 修复: spec-first doctor --repair-native\n` +
    `  国内镜像: spec-first doctor --repair-native --mirror=npmmirror\n\n`
  );
}

function showCrgHint() {
  const plat = process.platform;
  let sslFixLines;
  if (plat === 'win32') {
    sslFixLines = [
      `  CMD:         spec-first doctor --repair-native --mirror=npmmirror`,
      `  PowerShell:  spec-first doctor --repair-native --mirror=npmmirror`,
    ];
  } else {
    sslFixLines = [`               spec-first doctor --repair-native --mirror=npmmirror`];
  }

  let compilerHint;
  if (plat === 'win32') {
    compilerHint = `  2. 安装 VS Build Tools 2022（勾选"Desktop development with C++"）后:\n` +
                   `     https://aka.ms/vs/17/release/vs_BuildTools.exe\n` +
                   `     spec-first doctor --repair-native --build-from-source`;
  } else if (plat === 'darwin') {
    compilerHint = `  2. 安装 Xcode 命令行工具后:\n` +
                   `     xcode-select --install\n` +
                   `     spec-first doctor --repair-native --build-from-source`;
  } else {
    compilerHint = `  2. 安装 C++ 编译环境后:\n` +
                   `     apt-get install -y build-essential python3  # Debian/Ubuntu\n` +
                   `     spec-first doctor --repair-native --build-from-source`;
  }

  process.stdout.write(
    `  注意: CRG 原生模块 (better-sqlite3) 不可用\n` +
    `  spec-first init / doctor / clean 正常，spec-first crg 暂不可用\n\n` +
    `  修复方法（任选一）:\n` +
    `  1. 使用镜像重新下载预编译包:\n` +
    sslFixLines.join('\n') + '\n' +
    compilerHint + '\n\n'
  );
}
