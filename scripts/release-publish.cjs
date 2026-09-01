#!/usr/bin/env node

const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { runNpmChecked: runNpmCliChecked } = require('./lib/npm-cli.cjs');
const {
  assertPublishableGitState,
  recordReleaseCommitAndTag,
} = require('./lib/release-git.cjs');

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
  return runNpmCliChecked(args, {
    cwd: repoRoot,
    stdio: 'inherit',
  });
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
const skipGitGate = args.includes('--skip-git-gate');
const pkg = readPackageJson();

if (!requestedVersion) {
  fail('缺少版本参数。用法：pnpm run release:publish -- <version>|auto|patch|minor|major [--dry-run] [--skip-git-gate]');
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

// git 追溯门禁必须在写入目标版本号之前执行，否则脚本自己会把工作区写脏。
// 门禁通过后工作区保持干净，发布成功后才能精确地只 commit package.json。
let gitGate = null;
if (skipGitGate) {
  console.log('⚠ 已跳过 git 门禁（--skip-git-gate）：发布将不可追溯到干净的 git 状态，发布后需手动 commit 与打 tag。');
} else {
  console.log('\n▸ 检查 git 发布门禁...');
  gitGate = assertPublishableGitState({ cwd: repoRoot });
  if (!gitGate.ok) {
    fail(`git 门禁未通过（${gitGate.reason_code}）：${gitGate.message}`);
  }
  console.log(`  ✓ 工作区干净，发布分支：${gitGate.branch}`);
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
    try {
      runNpmChecked(['pack', '--dry-run']);
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

    // 发布已成功：git 记录失败不回滚 npm 发布，只报告手动补救命令并以非零退出提醒。
    // --skip-git-gate 语义是"维护者完全接管 git"，此处不自动改写 git 状态。
    if (gitGate && gitGate.ok) {
      console.log('\n▸ 固化发布记录（commit package.json + tag）...');
      const record = recordReleaseCommitAndTag({ cwd: repoRoot, version: effectivePkg.version });
      if (!record.ok) {
        console.error(`FAIL: ${record.message}`);
        console.error('  手动补救命令：');
        for (const command of record.manualCommands) {
          console.error(`    ${command}`);
        }
        exitCode = 1;
      } else {
        console.log(`  ✓ ${record.commitMessage} / tag ${record.tagName}`);
      }
    } else {
      console.log('\n▸ git 门禁已跳过，发布记录需手动固化：');
      console.log('    git add package.json');
      console.log(`    git commit -m "chore(release): v${effectivePkg.version}"`);
      console.log(`    git tag v${effectivePkg.version}`);
    }
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
