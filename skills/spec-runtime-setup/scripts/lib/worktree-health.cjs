'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function inspectGitHealth(targetPath = process.cwd()) {
  const resolvedRoot = path.resolve(targetPath);
  let root = resolvedRoot;
  try {
    root = fs.realpathSync(resolvedRoot);
  } catch {
    // 目标可能在检查期间消失；保留已解析路径供确定性诊断。
  }
  const gitEntry = path.join(root, '.git');
  if (!fs.existsSync(gitEntry)) {
    const probe = probeGitRoot(root);
    return {
      status: probe.status === 0 ? 'ok' : 'not-git',
      reason_code: probe.status === 0 ? 'git-ok' : 'not-git',
      git_entry_type: probe.status === 0 ? 'ancestor' : 'missing',
      root,
    };
  }

  const stat = fs.statSync(gitEntry);
  if (stat.isFile()) {
    const firstLine = fs.readFileSync(gitEntry, 'utf8').split('\n', 1)[0].replace(/\r$/, '');
    const match = /^gitdir:\s*(.+)$/i.exec(firstLine);
    if (!match) {
      return {
        status: 'corrupted-gitdir',
        reason_code: 'gitdir-file-unparseable',
        git_entry_type: 'file',
        root,
        worktree_pointer: { raw: firstLine, path: null, exists: false },
      };
    }
    const rawPointer = match[1].trim();
    const pointerPath = path.resolve(root, rawPointer);
    const exists = fs.existsSync(pointerPath);
    const probe = exists ? probeGitRoot(root) : null;
    const valid = exists && probe.status === 0;
    return {
      status: valid ? 'ok' : 'broken-worktree',
      reason_code: valid
        ? 'git-ok'
        : (exists ? 'broken-worktree-pointer-invalid' : 'broken-worktree'),
      git_entry_type: 'file',
      root,
      worktree_pointer: { raw: rawPointer, path: pointerPath, exists },
      diagnostic: exists && probe.status !== 0 ? probe.diagnostic : null,
    };
  }
  if (!stat.isDirectory()) {
    return {
      status: 'corrupted-gitdir',
      reason_code: 'gitdir-entry-invalid',
      git_entry_type: 'other',
      root,
    };
  }

  const probe = probeGitRoot(root);
  return {
    status: probe.status === 0 ? 'ok' : 'corrupted-gitdir',
    reason_code: probe.status === 0 ? 'git-ok' : 'gitdir-directory-invalid',
    git_entry_type: 'directory',
    root,
    diagnostic: probe.status === 0 ? null : probe.diagnostic,
  };
}

function probeGitRoot(root) {
  const result = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: 5000,
  });
  return {
    status: result.status,
    diagnostic: result.error
      ? result.error.message
      : String(result.stderr || '').trim().slice(0, 1000),
  };
}

function buildRepairWorktreePreview({ cwd = process.cwd(), argv = [] } = {}) {
  const args = Array.isArray(argv) ? argv : [];
  if (args.includes('--help') || args.includes('-h')) {
    return {
      schema_version: 'repair-worktree-preview.v1',
      exit_code: 0,
      mutation: false,
      reason_code: 'help',
      help: '用法：spec-first repair-worktree [--dry-run]',
    };
  }
  if (args.some((arg) => arg === '--apply' || arg === '--unlink')) {
    return {
      schema_version: 'repair-worktree-preview.v1',
      exit_code: 1,
      mutation: false,
      reason_code: 'repair-worktree-apply-deferred',
      diagnostic: '当前版本的 repair-worktree 仅支持 --dry-run。删除 .git 延后到具备 dry-run fingerprint 绑定的后续设计。',
    };
  }
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) {
    return {
      schema_version: 'repair-worktree-preview.v1',
      exit_code: 2,
      mutation: false,
      reason_code: 'repair-worktree-unknown-option',
      diagnostic: `未知 option：${unknown[0]}`,
    };
  }

  const gitHealth = inspectGitHealth(cwd);
  const nextActions = [];
  if (gitHealth.status === 'broken-worktree') {
    nextActions.push('检查已记录的 gitdir pointer，并从 Git metadata 或全新 clone 恢复缺失的 administrative worktree 目录。');
  } else if (gitHealth.status === 'corrupted-gitdir') {
    nextActions.push('检查 .git，并从可信 checkout 运行 git fsck 后重试。');
  } else if (gitHealth.status === 'not-git') {
    nextActions.push('请从受影响的 worktree root 运行此命令。');
  }
  return {
    schema_version: 'repair-worktree-preview.v1',
    exit_code: gitHealth.status === 'broken-worktree' ? 0 : 1,
    mutation: false,
    reason_code: gitHealth.status === 'broken-worktree'
      ? gitHealth.reason_code
      : 'repair-worktree-not-broken-worktree',
    git_health: gitHealth,
    next_actions: nextActions,
  };
}

module.exports = {
  buildRepairWorktreePreview,
  inspectGitHealth,
};
