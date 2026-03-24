/**
 * commit CLI 命令
 * spec-first commit [--message "<msg>"]
 */
import { execFileSync } from 'node:child_process';
import { ExitCode } from '../../shared/types.js';
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

  if (!message) {
    console.error('用法：spec-first commit --message "<msg>"');
    return ExitCode.VALIDATION_ERROR;
  }

  const governance = validateGovernanceStaging(projectRoot);
  if (!governance.ok) {
    console.error(`提交阻断：${governance.reason}`);
    return ExitCode.VALIDATION_ERROR;
  }

  // 构造 commit message
  const subject = message;
  const fullMessage = subject;

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
