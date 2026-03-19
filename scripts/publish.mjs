#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const versionArg = (process.argv[2] ?? 'auto').toLowerCase();
const dryRun = (process.argv[3] ?? '') === '--dry-run' || (process.argv[2] ?? '') === '--dry-run';
const versionBump = dryRun ? 'auto' : versionArg;

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
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    fail(`${command} ${args.join(' ')} 运行失败`, String(result.error));
  }
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} 退出码 ${result.status ?? 'null'}`);
  }
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));
  return pkg.version ?? '0.0.0';
}

function ensureCleanWorkspace() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    fail('git status 运行失败', String(result.error));
  }
  if ((result.stdout ?? '').trim()) {
    fail('工作区有未提交变更，请先提交');
  }

  const branch = spawnSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });

  if (branch.error) {
    fail('git branch 运行失败', String(branch.error));
  }

  const currentBranch = (branch.stdout ?? '').trim();
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    fail(`当前分支 ${currentBranch || '(detached)'}, 请切换到 main/master`);
  }
}

function verifyArtifacts() {
  const required = ['dist/cli/index.js', 'skills', 'templates'];
  for (const rel of required) {
    if (!existsSync(resolve(repoRoot, rel))) {
      fail(`缺少必要构建产物: ${rel}`);
    }
  }
}

console.log('══════════════════════════════════════');
console.log('  Spec-First 发布流程');
console.log('══════════════════════════════════════');

console.log('\n▸ 前置检查...');
ensureCleanWorkspace();
console.log('✓ Git 状态干净');

console.log('\n▸ TypeScript 类型检查...');
run('pnpm', ['run', 'typecheck']);

console.log('\n▸ 构建产物...');
run('pnpm', ['run', 'build']);

console.log('\n▸ 验证构建产物...');
verifyArtifacts();
console.log('✓ dist/cli/index.js 存在');
console.log('✓ skills/ 目录存在');
console.log('✓ templates/ 目录存在');

console.log(`\n▸ 版本升级: ${versionBump}`);
run('pnpm', ['run', 'release:version', '--', versionBump]);
const newVersion = readVersion();
console.log(`✓ 新版本: ${newVersion}`);

console.log('\n▸ 发布包校验...');
run('pnpm', ['run', 'release:check']);

console.log('');
if (dryRun) {
  console.log('▸ 模拟发布 (dry-run)...');
  run('npm', ['publish', '--dry-run']);
  console.log('✓ Dry-run 完成，未实际发布');
} else {
  console.log('▸ 发布到 npm...');
  run('npm', ['publish']);
  console.log(`✓ 已发布 spec-first@${newVersion}`);

  console.log('\n▸ Git 提交与 Tag...');
  run('git', ['add', 'package.json']);
  run('git', ['commit', '-m', `chore: release v${newVersion}`]);
  run('git', ['tag', `v${newVersion}`]);
  console.log(`✓ 已创建 tag v${newVersion}`);
  console.log('\n提示: 运行 git push && git push --tags 推送到远程');
}

console.log('\n══════════════════════════════════════');
console.log(`  发布完成: spec-first@${newVersion}`);
console.log('══════════════════════════════════════');
