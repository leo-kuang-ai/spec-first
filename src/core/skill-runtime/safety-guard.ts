import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';

const GIT_COMMAND_TIMEOUT_MS = 5_000;

export interface HighRiskAssessment {
  isHighRisk: boolean;
  reasons: string[];
  requiresWorktree: boolean;
}

export interface SafetyAssessment {
  level: 'safe' | 'warning' | 'dangerous';
  signals: string[];
  recommendedActions?: string[];
  highRiskAssessment?: HighRiskAssessment;
}

function hasLocalGitRepo(projectRoot: string): boolean {
  return exists(join(projectRoot, '.git'));
}

function runGit(projectRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    timeout: GIT_COMMAND_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function getCurrentGitBranch(projectRoot: string): string | undefined {
  if (!hasLocalGitRepo(projectRoot)) return undefined;
  try {
    const symbolic = runGit(projectRoot, ['symbolic-ref', '--short', 'HEAD']);
    if (symbolic && symbolic.toLowerCase() !== 'head') return symbolic;
  } catch {
    // fallback below
  }

  try {
    const output = runGit(projectRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
    return output && output.toLowerCase() !== 'head' ? output : undefined;
  } catch {
    return undefined;
  }
}

function isProtectedBranch(branch: string | undefined): boolean {
  if (!branch) return false;
  return ['main', 'master', 'mainline', 'production', 'prod', 'head'].includes(
    branch.toLowerCase()
  );
}

function hasUncommittedChanges(projectRoot: string): boolean {
  if (!hasLocalGitRepo(projectRoot)) return false;
  try {
    return runGit(projectRoot, ['status', '--porcelain']).length > 0;
  } catch {
    return false;
  }
}

export function assessHighRiskChanges(projectRoot: string, _featureId?: string): HighRiskAssessment {
  const reasons: string[] = [];
  let requiresWorktree = false;

  if (!hasLocalGitRepo(projectRoot)) {
    return { isHighRisk: false, reasons, requiresWorktree };
  }

  try {
    const commitCountOutput = runGit(projectRoot, ['rev-list', '--count', 'HEAD']);
    const commitCount = parseInt(commitCountOutput.trim(), 10) || 0;
    const depth = Math.max(1, Math.min(commitCount, 5));
    const diffOutput = runGit(projectRoot, ['diff', '--name-only', `HEAD~${depth}`]);
    const changedFiles = diffOutput.split('\n').filter((file) => file.trim());
    const dirs = new Set(changedFiles.map((file) => file.split('/')[0] ?? 'root'));

    if (dirs.size >= 3) {
      reasons.push(`跨目录变更: ${dirs.size} 个目录`);
      requiresWorktree = true;
    }

    const corePatterns = ['src/core/', 'src/shared/', 'config.'];
    if (changedFiles.some((file) => corePatterns.some((pattern) => file.includes(pattern)))) {
      reasons.push('涉及核心模块变更');
      requiresWorktree = true;
    }
  } catch {
    // 忽略 Git 探测失败
  }

  return {
    isHighRisk: reasons.length > 0,
    reasons,
    requiresWorktree,
  };
}

export function assessSafety(
  skillName: string,
  projectRoot: string,
  featureId?: string
): SafetyAssessment {
  const signals: string[] = [];
  const recommendedActions: string[] = [];
  const branch = getCurrentGitBranch(projectRoot);
  const highRiskAssessment = assessHighRiskChanges(projectRoot, featureId);

  if (isProtectedBranch(branch)) {
    signals.push(`当前在保护分支: ${branch}`);
    recommendedActions.push('建议切换到独立 worktree 或功能分支后继续执行');
  }

  if (highRiskAssessment.isHighRisk) {
    signals.push(...highRiskAssessment.reasons);
    recommendedActions.push('建议在隔离工作区中完成高风险改动');
  }

  if (hasUncommittedChanges(projectRoot)) {
    signals.push('存在未提交变更');
    recommendedActions.push('建议先检查 git diff，避免叠加未知改动');
  }

  if (skillName === 'code' && featureId) {
    const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
    if (exists(taskPlanPath) && readMarkdown(taskPlanPath).includes('[WORKTREE-CONFIRMED]')) {
      recommendedActions.push('task_plan.md 已显式记录 WORKTREE-CONFIRMED');
    }
  }

  if (signals.length === 0) {
    return { level: 'safe', signals, recommendedActions: [] };
  }

  return {
    level: isProtectedBranch(branch) && highRiskAssessment.requiresWorktree ? 'dangerous' : 'warning',
    signals,
    recommendedActions,
    highRiskAssessment,
  };
}

export function buildSafetyNotice(assessment: SafetyAssessment, skillName: string): string | undefined {
  if (assessment.signals.length === 0) return undefined;

  const lines = [
    '<!-- safety-guard-context -->',
    '## Safety Guard',
    `- skill: ${skillName}`,
    `- level: ${assessment.level}`,
    ...assessment.signals.map((signal) => `- signal: ${signal}`),
  ];

  if (assessment.recommendedActions?.length) {
    lines.push(...assessment.recommendedActions.map((action) => `- action: ${action}`));
  }

  lines.push('<!-- /safety-guard-context -->');
  return lines.join('\n');
}
