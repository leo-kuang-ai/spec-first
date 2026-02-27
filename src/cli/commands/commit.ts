/**
 * commit CLI 命令
 * spec-first commit [--message "<msg>"] [--task <taskId>]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { parseFlag } from '../parse-utils.js';

const GIT_COMMIT_TIMEOUT_MS = 30_000;

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

  const taskPlan = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!exists(taskPlan)) return undefined;

  const content = readFileSync(taskPlan, 'utf-8');
  for (const line of content.split('\n')) {
    if (line.includes('In Progress')) {
      const match = line.match(/TASK-[\w-]+/);
      if (match) return match[0];
    }
  }
  return undefined;
}

function isValidTaskId(id: string): boolean {
  // TASK-<ABBR>-<SEQ> 格式
  // ABBR: 1-20 个大写字母或数字（任务缩写）
  // SEQ: 至少 1 位数字（序号）
  return /^TASK-[A-Z0-9]{1,20}-\d{1,}$/.test(id);
}
