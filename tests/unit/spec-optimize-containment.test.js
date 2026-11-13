'use strict';

// 回归测试：SUP-02 - experiment 越界目录创建
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:145-152

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'optimize-contain-'));
}

function exec(cmd, cwd) {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

describe('experiment-worktree.sh containment — SUP-02', () => {
  const scriptPath = path.join(__dirname, '../../skills/spec-optimize/scripts/experiment-worktree.sh');

  test('containment 校验在目录创建前执行', () => {
    const root = tmpDir();
    const outside = path.join(root, 'outside');

    try {
      // 创建临时仓库
      exec('git init -b main', root);
      exec('git config user.name "Test"', root);
      exec('git config user.email "test@example.com"', root);

      // 创建外部目录
      fs.mkdirSync(outside);

      // baseline: shared -> outside (symlink)
      const sharedLink = path.join(root, 'shared');
      fs.symlinkSync(outside, sharedLink);
      fs.writeFileSync(path.join(root, 'README.md'), 'baseline');
      exec('git add README.md', root);
      exec('git commit -m "baseline"', root);
      const baselineCommit = exec('git rev-parse HEAD', root).trim();

      // current: shared is real dir with nested/data.txt
      exec('git checkout -b current', root);
      fs.rmSync(sharedLink, { force: true });
      fs.mkdirSync(path.join(root, 'shared/nested'), { recursive: true });
      fs.writeFileSync(path.join(root, 'shared/nested/data.txt'), 'shared data');
      exec('git add shared', root);
      exec('git commit -m "shared now real dir"', root);

      // 回到 main (baseline)
      exec('git checkout main', root);

      // 创建实验目录
      const worktreeDir = path.join(root, '.optimize-experiments');
      fs.mkdirSync(worktreeDir);

      // 记录外部目录初始状态（空）
      const outsideBefore = fs.readdirSync(outside);
      expect(outsideBefore).toEqual([]);

      // 调用脚本（无论成功或失败，都不应在外部目录创建内容）
      try {
        // 即使脚本在其他步骤失败，也不应该在外部目录留下副作用
        exec(`bash ${scriptPath} create review 1 ${baselineCommit} shared/nested/data.txt`, root);
      } catch (error) {
        // 可能因为各种原因失败，但这不是测试重点
      }

      // 核心断言：外部目录完全不变
      const outsideAfter = fs.readdirSync(outside);
      expect(outsideAfter).toEqual([]);

      // 特别确认 nested/ 不存在
      const nestedOutside = path.join(outside, 'nested');
      expect(fs.existsSync(nestedOutside)).toBe(false);

    } finally {
      if (fs.existsSync(root)) {
        // 清理 worktree
        try {
          const worktrees = exec('git worktree list --porcelain', root);
          const worktreePaths = worktrees.match(/^worktree (.+)$/gm);
          if (worktreePaths) {
            for (const line of worktreePaths) {
              const wtPath = line.replace('worktree ', '');
              if (wtPath !== root) {
                try { exec(`git worktree remove --force ${wtPath}`, root); } catch (e) {}
              }
            }
          }
        } catch (e) {}

        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  });
});
