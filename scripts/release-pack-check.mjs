#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
const packageName = packageJson.name ?? 'spec-first';
const buildEntry = join(repoRoot, 'dist', 'cli', 'index.js');
const npmCacheDir = mkdtempSync(join(tmpdir(), 'spec-first-npm-cache-'));

function packageInstallPath(prefix, name) {
  return join(prefix, 'node_modules', ...name.split('/'));
}

function fail(message, details = '') {
  console.error(`FAIL: ${message}`);
  if (details) {
    console.error(details.trimEnd());
  }
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
      npm_config_update_notifier: 'false',
      npm_config_fund: 'false',
      npm_config_audit: 'false',
    },
    ...options,
  });

  if (result.error) {
    fail(`${command} ${args.join(' ')} 运行失败`, String(result.error));
  }
  if (result.status !== 0) {
    fail(
      `${command} ${args.join(' ')} 退出码 ${result.status ?? 'null'}`,
      [result.stdout, result.stderr].filter(Boolean).join('\n')
    );
  }

  return result;
}

function cleanup(paths) {
  if (process.env.RELEASE_PACKAGE_KEEP_TMP === '1') {
    return;
  }
  for (const path of paths) {
    rmSync(path, { recursive: true, force: true });
  }
}

if (!existsSync(buildEntry)) {
  fail(`缺少构建产物 ${buildEntry}，请先执行 pnpm run build`);
}

const packDir = mkdtempSync(join(tmpdir(), 'spec-first-pack-'));
const installDir = mkdtempSync(join(tmpdir(), 'spec-first-install-'));
const runDir = mkdtempSync(join(tmpdir(), 'spec-first-run-'));

try {
  console.log('▸ npm pack');
  const packResult = run('npm', ['pack', '--json', '--pack-destination', packDir]);
  const packed = JSON.parse(packResult.stdout.trim());
  const tarballName = Array.isArray(packed) ? packed[0]?.filename : undefined;
  const packedFiles = Array.isArray(packed) ? packed[0]?.files ?? [] : [];

  if (!tarballName) {
    fail('npm pack 未返回 tarball 文件名', packResult.stdout);
  }

  const tarballPath = join(packDir, tarballName);
  if (!existsSync(tarballPath)) {
    fail(`tarball 不存在: ${tarballPath}`);
  }

  const installedPkgDir = packageInstallPath(installDir, packageName);
  mkdirSync(installedPkgDir, { recursive: true });
  mkdirSync(join(installedPkgDir, 'dist'), { recursive: true });
  mkdirSync(join(installedPkgDir, 'skills'), { recursive: true });
  cpSync(join(repoRoot, 'dist'), join(installedPkgDir, 'dist'), { recursive: true });
  cpSync(join(repoRoot, 'skills', 'spec-first'), join(installedPkgDir, 'skills', 'spec-first'), {
    recursive: true,
  });
  cpSync(join(repoRoot, 'package.json'), join(installedPkgDir, 'package.json'));

  const repoNodeModules = join(repoRoot, 'node_modules');
  if (!existsSync(repoNodeModules)) {
    fail(`缺少依赖目录: ${repoNodeModules}`);
  }
  symlinkSync(repoNodeModules, join(installedPkgDir, 'node_modules'), 'junction');

  const requiredFilePaths = [
    'dist/cli/index.js',
    'skills/spec-first/00-first/SKILL.md',
    'skills/spec-first/00-first/references/main-thread-contract.md',
  ];

  const requiredFiles = requiredFilePaths.map((relativePath) => join(installedPkgDir, relativePath));

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      fail(`发布包缺少必要文件: ${file}`);
    }
  }

  const packedPaths = new Set(
    packedFiles
      .map((entry) => entry?.path ?? entry?.name)
      .filter((value) => typeof value === 'string')
  );

  for (const relativePath of requiredFilePaths) {
    if (!packedPaths.has(relativePath)) {
      fail(`npm pack 输出缺少必要文件: ${relativePath}`, JSON.stringify(packedFiles, null, 2));
    }
  }

  console.log('▸ node dist/cli/index.js skill render first');
  const render = spawnSync(
    process.execPath,
    [join(installedPkgDir, 'dist', 'cli', 'index.js'), 'skill', 'render', 'first'],
    {
      cwd: runDir,
      encoding: 'utf8',
      shell: false,
    }
  );

  if (render.error) {
    fail('渲染 first skill 运行失败', String(render.error));
  }
  if (render.status !== 0) {
    fail(
      `渲染 first skill 失败，退出码 ${render.status ?? 'null'}`,
      [render.stdout, render.stderr].filter(Boolean).join('\n')
    );
  }

  const rendered = render.stdout ?? '';
  const requiredSnippets = [
    '<!-- skill-files-context -->',
    'skill_path:',
    '/skills/spec-first/00-first/SKILL.md',
    'references_root:',
    'main-thread-contract.md',
  ];

  for (const snippet of requiredSnippets) {
    if (!rendered.includes(snippet)) {
      fail(`渲染输出缺少片段: ${snippet}`, rendered);
    }
  }

  console.log('▸ node dist/cli/index.js --version');
  const version = execFileSync(process.execPath, [join(installedPkgDir, 'dist', 'cli', 'index.js'), '--version'], {
    cwd: runDir,
    encoding: 'utf8',
  }).trim();

  if (!version) {
    fail('发布包 --version 输出为空');
  }

  console.log('');
  console.log('✅ 发布包校验通过');
  console.log(`   package: ${packageName}`);
  console.log(`   version: ${version}`);
  console.log(`   tarball: ${tarballPath}`);
} finally {
  cleanup([packDir, installDir, runDir, npmCacheDir]);
}
