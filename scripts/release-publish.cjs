#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(repoRoot, 'package.json');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function writePackageJson(pkg) {
  writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function runNpmChecked(args) {
  const result = spawnSync('npm', args, {
    cwd: repoRoot,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.error) {
    const wrapped = new Error(`npm ${args.join(' ')} 运行失败: ${result.error.message}`);
    wrapped.status = 1;
    throw wrapped;
  }
  if (result.status !== 0) {
    const wrapped = new Error(`npm ${args.join(' ')} 运行失败`);
    wrapped.status = Number.isInteger(result.status) ? result.status : 1;
    throw wrapped;
  }
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/.test(value);
}

function bumpVersion(currentVersion, releaseType) {
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    fail(`当前 package.json version 不合法: ${currentVersion}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (releaseType) {
    case 'auto':
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      return releaseType;
  }
}

const args = process.argv.slice(2);
const requestedVersion = args.find((arg) => !arg.startsWith('-'));
const dryRun = args.includes('--dry-run');
const pkg = readPackageJson();

if (!requestedVersion) {
  fail('缺少版本参数。用法：pnpm run release:publish -- <version>|auto|patch|minor|major [--dry-run]');
}

const targetVersion = ['auto', 'patch', 'minor', 'major'].includes(requestedVersion)
  ? bumpVersion(pkg.version, requestedVersion)
  : requestedVersion;

if (!isSemver(targetVersion)) {
  fail(`版本号不合法: ${requestedVersion}`);
}

console.log('══════════════════════════════════════');
console.log('  Spec-First 发布流程');
console.log('══════════════════════════════════════');
console.log(`▸ 包名: ${pkg.name}`);
console.log(`▸ 当前版本: ${pkg.version}`);
console.log(`▸ 目标版本: ${targetVersion}`);
console.log(`▸ 模式: ${dryRun ? 'dry-run' : 'publish'}`);

if (requestedVersion !== targetVersion) {
  console.log(`▸ ${requestedVersion} 已解析为 ${targetVersion}`);
}

let exitCode = 0;
let wroteTargetVersion = false;
let publishSucceeded = false;

try {
  if (pkg.version !== targetVersion) {
    const nextPkg = { ...pkg, version: targetVersion };
    writePackageJson(nextPkg);
    wroteTargetVersion = true;
    console.log(`▸ ${dryRun ? '临时写入' : '已将'} package.json version 更新为 ${targetVersion}`);
  }

  const effectivePkg = readPackageJson();
  if (effectivePkg.version !== targetVersion) {
    throw new Error(`版本写入失败：package.json=${effectivePkg.version}，目标=${targetVersion}`);
  }

  console.log('\n▸ 运行目标版本发布校验...');
  runNpmChecked(['run', 'test:release']);
  runNpmChecked(['run', 'test:release:website']);

  if (dryRun) {
    console.log('\n▸ 预览发布 tarball 内容...');
    // pnpm 不支持 pack --dry-run，直接用 npm 二进制避免 npm_execpath 指向 pnpm 时出错
    try {
      spawnSync('npm', ['pack', '--dry-run'], { cwd: repoRoot, stdio: 'inherit' });
    } catch (_) {
      console.log('  (tarball 预览跳过：npm pack --dry-run 不可用)');
    }
  } else {
    console.log('\n▸ 生成发布 tarball...');
    runNpmChecked(['pack']);
  }

  if (dryRun) {
    console.log(`\n✓ Dry-run 完成，未实际发布；目标版本校验为 ${effectivePkg.version}`);
  } else {
    console.log('\n▸ 发布到 npm...');
    runNpmChecked(['publish', '--registry=https://registry.npmjs.org', '--no-git-checks']);
    publishSucceeded = true;
    console.log(`\n✓ 已发布 ${effectivePkg.name}@${effectivePkg.version}`);
  }
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  exitCode = Number.isInteger(error.status) ? error.status : 1;
} finally {
  if (wroteTargetVersion && (dryRun || !publishSucceeded)) {
    writePackageJson(pkg);
    console.log(`▸ 已恢复 package.json version 为 ${pkg.version}`);
  }
}

process.exitCode = exitCode;
