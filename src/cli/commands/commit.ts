/**
 * commit CLI 命令
 * spec-first commit [--message "<msg>"] [--task <taskId>]
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';

/** 解析 --flag value 参数 */
function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

export function handleCommit(args: string[]): number {
  const projectRoot = process.cwd();
  const message = parseFlag(args, '--message') ?? parseFlag(args, '-m');
  const taskId = parseFlag(args, '--task') ?? inferTaskId(projectRoot);

  if (!message) {
    console.error('Usage: spec-first commit --message "<msg>" [--task <taskId>]');
    return ExitCode.VALIDATION_ERROR;
  }

  if (taskId && !isValidTaskId(taskId)) {
    console.error(`Invalid TASK ID: ${taskId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  // 构造 commit message
  const subject = taskId ? `[${taskId}] ${message}` : message;
  const trailer = taskId ? `\n\ntraces: ${taskId}` : '';
  const fullMessage = subject + trailer;

  try {
    execSync(`git commit -m ${JSON.stringify(fullMessage)}`, {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(`Committed: ${subject}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('nothing to commit')) {
      console.error('Nothing to commit (working tree clean)');
    } else {
      console.error(`Commit failed: ${msg.split('\n')[0]}`);
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
  return /^TASK-[\w-]+$/.test(id);
}
