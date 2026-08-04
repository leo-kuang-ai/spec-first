'use strict';

const {
  buildRepairWorktreePreview,
} = require('../../../skills/spec-runtime-setup/scripts/lib/worktree-health.cjs');

function runRepairWorktree(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const result = buildRepairWorktreePreview({ cwd: process.cwd(), argv: args });
  if (result.reason_code === 'help') {
    printHelp();
    return 0;
  }
  if (result.exit_code !== 0) {
    process.stderr.write(`reason_code=${result.reason_code}\n`);
    if (result.diagnostic) process.stderr.write(`${result.diagnostic}\n`);
    if (result.git_health) {
      process.stderr.write(
        `repair-worktree 仅适用于当前目录存在损坏的 .git worktree pointer。当前状态：${result.git_health.status}。\n`,
      );
    }
    return result.exit_code;
  }
  renderRepairPreview(result);
  return 0;
}

function printHelp() {
  process.stdout.write(`用法：spec-first repair-worktree [--dry-run]\n\n预览损坏的 Git worktree pointer 修复指引。此命令绝不会删除 .git。\n`);
}

function renderRepairPreview(result) {
  const health = result.git_health;
  const pointer = health.worktree_pointer || {};
  process.stdout.write([
    'repair_worktree_dry_run=true',
    `generated_at=${new Date().toISOString()}`,
    `reason_code=${health.reason_code}`,
    '',
    '损坏的 worktree pointer：',
    `  git_file: ${health.root}/.git`,
    `  pointer_raw: ${pointer.raw || ''}`,
    `  pointer_path: ${pointer.path || ''}`,
    `  pointer_exists: ${pointer.exists === true ? 'true' : 'false'}`,
    '',
    'Unlink 预览：',
    '  此命令不会删除文件。',
    '  如果你确认这个 stale worktree pointer 可以安全移除，请手动运行：',
    `    rm "${health.root}/.git"`,
    '',
    '人工修复指引：',
    '  如果此目录应成为普通 Git repo，请自行移除 stale .git pointer，然后运行 git init 或恢复正确的 repository metadata。',
    '  如果此目录应继续作为 parent workspace，请让 repo-local artifact 保持 advisory-only，并使用 --repo <child> 选择 child repo。',
    '',
    '临时方案：',
    '  若要显式索引 non-git folder，请使用 --folder . 运行相关 setup/bootstrap flow。',
    '',
  ].join('\n'));
}

module.exports = {
  renderRepairPreview,
  runRepairWorktree,
};
