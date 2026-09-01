'use strict';

// release-publish 的 git 追溯门禁与发布后固化记录。
// 拆成独立模块是为了让门禁语义可单测（真实 tmp git repo + 注入执行器），
// 顶层脚本只做接线。git 命令失败时返回 reason_code 与手动补救命令，
// 不抛异常——发布脚本需要区分"发布前阻断"与"发布已成功、记录失败"两种后果。

const { spawnSync } = require('node:child_process');

const RELEASE_BRANCHES = ['main', 'master'];

function runGitDefault(args, options = {}) {
  return spawnSync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8',
  });
}

function describeGitFailure(result) {
  if (result.error) {
    return result.error.message;
  }
  const stderr = String(result.stderr || '').trim();
  return stderr || `git exited with code ${result.status}`;
}

// 发布前门禁：工作区干净 + 处于受支持发布分支。
// 检查必须发生在脚本写入目标版本号之前，否则脚本自己就会把工作区写脏。
function assertPublishableGitState(options = {}) {
  const runGit = options.runGit || runGitDefault;
  const cwd = options.cwd;
  const allowedBranches = options.allowedBranches || RELEASE_BRANCHES;

  const insideWorkTree = runGit(['rev-parse', '--is-inside-work-tree'], { cwd });
  if (
    insideWorkTree.error
    || insideWorkTree.status !== 0
    || String(insideWorkTree.stdout).trim() !== 'true'
  ) {
    return {
      ok: false,
      reason_code: 'git-worktree-unavailable',
      message: 'git 不可用或当前目录不在 git work tree 内；发布必须可追溯到 git 历史。',
    };
  }

  const status = runGit(['status', '--porcelain'], { cwd });
  if (status.error || status.status !== 0) {
    return {
      ok: false,
      reason_code: 'git-status-unavailable',
      message: `无法读取 git 工作区状态：${describeGitFailure(status)}`,
    };
  }
  if (String(status.stdout).trim().length > 0) {
    return {
      ok: false,
      reason_code: 'dirty-worktree',
      message: '工作区存在未提交变更。先 commit 或 stash（untracked 文件需 git stash -u），再重试发布；确需带脏发布时显式传 --skip-git-gate。',
    };
  }

  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  if (branch.error || branch.status !== 0) {
    return {
      ok: false,
      reason_code: 'git-branch-unavailable',
      message: `无法确定当前分支：${describeGitFailure(branch)}`,
    };
  }
  const branchName = String(branch.stdout || '').trim();
  if (branchName === 'HEAD') {
    return {
      ok: false,
      reason_code: 'detached-head',
      message: `当前处于 detached HEAD；请在发布分支（${allowedBranches.join(' 或 ')}）上发布。`,
    };
  }
  if (!allowedBranches.includes(branchName)) {
    return {
      ok: false,
      reason_code: 'unexpected-branch',
      message: `当前分支为 ${branchName}，不在发布分支白名单（${allowedBranches.join(' / ')}）内；如确需在此分支发布，显式传 --skip-git-gate。`,
    };
  }

  return { ok: true, branch: branchName };
}

// 手动补救命令要求"照抄可执行"：含空格/括号的参数（如 commit message）
// 必须加引号，否则 git 会把消息里的词当 pathspec。
function shellQuote(arg) {
  return /^[\w./:=,-]+$/.test(arg) ? arg : `'${String(arg).replace(/'/g, "'\\''")}'`;
}

function formatGitCommand(args) {
  return `git ${args.map(shellQuote).join(' ')}`;
}

// 发布成功后把版本 bump 固化进 git：commit package.json 并打 v<version> tag。
// 前置条件是门禁已通过（工作区干净），因此 add 的范围精确锁定 package.json。
// npm publish 已成功，此处失败不得回滚发布，只返回手动补救命令。
function recordReleaseCommitAndTag(options = {}) {
  const runGit = options.runGit || runGitDefault;
  const cwd = options.cwd;
  const version = options.version;
  if (!version || typeof version !== 'string') {
    return {
      ok: false,
      reason_code: 'invalid-version',
      message: 'recordReleaseCommitAndTag 需要非空 version。',
    };
  }

  const commands = [
    ['add', 'package.json'],
    ['commit', '-m', `chore(release): v${version}`],
    ['tag', `v${version}`],
  ];

  const completed = [];
  for (let index = 0; index < commands.length; index += 1) {
    const args = commands[index];
    const result = runGit(args, { cwd });
    if (result.error || result.status !== 0) {
      return {
        ok: false,
        reason_code: 'git-record-failed',
        failedCommand: args,
        failedDetail: describeGitFailure(result),
        completed,
        // 补救命令从失败步骤开始覆盖到流程末尾：照抄执行即可完成固化，
        // 不要求维护者记住失败点之后还剩哪些步骤。
        manualCommands: commands.slice(index).map(formatGitCommand),
        message: `发布已完成，但 git 记录在 \`git ${args.join(' ')}\` 失败：${describeGitFailure(result)}`,
      };
    }
    completed.push(args);
  }

  return {
    ok: true,
    completed,
    tagName: `v${version}`,
    commitMessage: `chore(release): v${version}`,
  };
}

module.exports = {
  RELEASE_BRANCHES,
  assertPublishableGitState,
  recordReleaseCommitAndTag,
};
