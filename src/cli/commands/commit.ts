/**
 * commit CLI 命令
 * spec-first commit [--message "<msg>"] [--task <taskId>]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { getCurrentTaskId } from '../../core/task-plan/parser.js';
import { parseFlag } from '../parse-utils.js';

const GIT_COMMIT_TIMEOUT_MS = 30_000;
const SOURCE_FILE_PREFIXES = [
  'src/',
  'scripts/',
  'templates/',
  'skills/',
  '.spec-first/hooks/',
] as const;
const SOURCE_FILE_EXACT = [
  'package.json',
  'tsconfig.json',
  'eslint.config.js',
  'vitest.config.ts',
  'tsup.config.ts',
] as const;

export function handleCommit(args: string[]): number {
  const projectRoot = process.cwd();
  const message = parseFlag(args, '--message') ?? parseFlag(args, '-m');
  const taskId = parseFlag(args, '--task') ?? inferTaskId(projectRoot);

  if (!message) {
    console.error('用法：spec-first commit --message "<msg>" [--task <taskId>]');
    return ExitCode.VALIDATION_ERROR;
  }

  if (taskId && !isValidTaskId(taskId)) {
    console.error(`无效的 TASK ID：${taskId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const governance = validateGovernanceStaging(projectRoot);
  if (!governance.ok) {
    console.error(`提交阻断：${governance.reason}`);
    return ExitCode.VALIDATION_ERROR;
  }

  // 构造 commit message
  const subject = taskId ? `[${taskId}] ${message}` : message;
  const trailer = taskId ? `\n\ntraces: ${taskId}` : '';
  const fullMessage = subject + trailer;

  try {
    execFileSync('git', ['commit', '-m', fullMessage], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: GIT_COMMIT_TIMEOUT_MS,
    });
    console.log(`已提交：${subject}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('nothing to commit')) {
      console.error('没有可提交内容（工作区干净）');
    } else {
      console.error(`提交失败：${msg.split('\n')[0]}`);
    }
    return ExitCode.IO_ERROR;
  }
}

/** 从 .spec-first/current + task_plan.md 推断当前 TASK ID */
function inferTaskId(projectRoot: string): string | undefined {
  const currentFile = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentFile)) return undefined;

  const featureId = readFileSync(currentFile, 'utf-8').trim().split('\n')[0];
  if (!featureId) return undefined;

  return getCurrentTaskId(projectRoot, featureId);
}

function isValidTaskId(id: string): boolean {
  // TASK-<ABBR>-<SEQ> 格式
  // ABBR: 1-20 个大写字母或数字（任务缩写）
  // SEQ: 至少 1 位数字（序号）
  return /^TASK-[A-Z0-9]{1,20}-\d{1,}$/.test(id);
}

function listStagedFiles(projectRoot: string): string[] {
  try {
    const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRD'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: GIT_COMMIT_TIMEOUT_MS,
    }).trim();
    if (!out) return [];
    return out
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    // 非 Git 环境或索引不可读时，交由 git commit 主流程处理
    return [];
  }
}

function isSourceFile(path: string): boolean {
  if (SOURCE_FILE_EXACT.includes(path as (typeof SOURCE_FILE_EXACT)[number])) return true;
  return SOURCE_FILE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function validateGovernanceStaging(
  projectRoot: string
): { ok: true } | { ok: false; reason: string } {
  const staged = listStagedFiles(projectRoot);
  if (staged.length === 0) return { ok: true };

  const hasSourceChanges = staged.some(isSourceFile);
  if (!hasSourceChanges) return { ok: true };

  if (!staged.includes('CHANGELOG.md')) {
    return { ok: false, reason: '检测到源码变更，但暂存区缺少 CHANGELOG.md 记录' };
  }
  if (!staged.includes('CLAUDE.md')) {
    return { ok: false, reason: '检测到源码变更，但暂存区缺少 CLAUDE.md 同步变更' };
  }
  return { ok: true };
}
