import { join } from 'node:path';
import { exists, readJsonChecked, readMarkdown, parseMarkdownTable } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { execFileSync } from 'node:child_process';

const HARD_GATE_STAGE_REQUIREMENTS: Record<string, string> = {
  design: '02_design',
  code: '04_implement',
};
const GIT_COMMAND_TIMEOUT_MS = 5_000;

/** 高风险变更判定（Superpowers P1-3） */
export interface HighRiskAssessment {
  isHighRisk: boolean;
  reasons: string[];
  requiresWorktree: boolean;
}

export interface HardGateDecision {
  allowed: boolean;
  severity: 'PASS' | 'WARN' | 'BLOCKED';
  reason: string;
  remediation: string;
  /** 高风险评估（Worktree First，Superpowers P1-3） */
  highRiskAssessment?: HighRiskAssessment;
}

function readCurrentFeature(projectRoot: string): string | undefined {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentPath)) return undefined;
  const featureId = readMarkdown(currentPath).trim();
  return featureId || undefined;
}

function readCurrentStage(projectRoot: string, featureId: string): string | undefined {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) return undefined;
  try {
    const state = readJsonChecked(statePath, isStageState);
    return state.currentStage;
  } catch {
    return undefined;
  }
}

function hasInProgressTask(taskPlan: string): boolean {
  for (const cells of parseMarkdownTable(taskPlan)) {
    const hasTaskId = cells.some(cell => /^TASK-/i.test(cell));
    if (!hasTaskId) continue;
    const hasInProgress = cells.some((cell) => {
      const normalized = cell.toLowerCase();
      return normalized === 'in_progress' || normalized === 'in progress' || normalized === '进行中';
    });
    if (hasInProgress) return true;
  }
  return false;
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

/** 检测当前 Git 分支（Superpowers P1-3） */
function getCurrentGitBranch(projectRoot: string): string | undefined {
  if (!hasLocalGitRepo(projectRoot)) return undefined;
  try {
    const symbolic = runGit(projectRoot, ['symbolic-ref', '--short', 'HEAD']);
    if (symbolic && symbolic.toLowerCase() !== 'head') {
      return symbolic;
    }
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

/** 判断是否为保护分支（main/master） */
function isProtectedBranch(branch: string | undefined): boolean {
  if (!branch) return false;
  const protectedBranches = ['main', 'master', 'mainline', 'production', 'prod', 'head'];
  return protectedBranches.includes(branch.toLowerCase());
}

function isLinkedWorktree(projectRoot: string): boolean {
  if (!hasLocalGitRepo(projectRoot)) return false;
  try {
    const gitDir = runGit(projectRoot, ['rev-parse', '--git-dir']);
    return /[\\/]worktrees[\\/]/.test(gitDir);
  } catch {
    return false;
  }
}

function hasWorktreeConfirmed(specDir: string): boolean {
  const taskPlanPath = join(specDir, 'task_plan.md');
  if (!exists(taskPlanPath)) return false;
  const content = readMarkdown(taskPlanPath).toUpperCase();
  return content.includes('[WORKTREE-CONFIRMED]');
}

/** 高风险变更评估（Superpowers P1-3） */
function assessHighRiskChanges(projectRoot: string, featureId: string): HighRiskAssessment {
  const reasons: string[] = [];
  let requiresWorktree = false;
  const hasGitRepo = hasLocalGitRepo(projectRoot);

  // 检查是否有跨目录重构信号
  if (hasGitRepo) {
    try {
      // 先获取实际提交数，避免在浅克隆或新仓库中失败
      const commitCountOutput = runGit(projectRoot, ['rev-list', '--count', 'HEAD']);
      const commitCount = parseInt(commitCountOutput.trim(), 10) || 0;

      // 使用实际提交数和5的较小值作为深度
      const depth = Math.max(1, Math.min(commitCount, 5));
      const diffOutput = runGit(projectRoot, ['diff', '--name-only', `HEAD~${depth}`]);

      if (diffOutput) {
        const changedFiles = diffOutput.split('\n').filter(f => f.trim());
        const dirs = new Set(changedFiles.map(f => f.split('/')[0] ?? 'root'));

        // 跨 3+ 目录视为高风险
        if (dirs.size >= 3) {
          reasons.push(`跨目录变更: ${dirs.size} 个目录`);
          requiresWorktree = true;
        }

        // 检查是否修改核心文件
        const corePatterns = ['src/core/', 'src/shared/', 'config.'];
        const hasCoreChanges = changedFiles.some(f =>
          corePatterns.some(p => f.includes(p)),
        );
        if (hasCoreChanges) {
          reasons.push('涉及核心模块变更');
          requiresWorktree = true;
        }
      }
    } catch (e) {
      // Git 不可用时记录警告，安全退化为"无风险"
      console.warn(`hard-gate: 无法检查高风险变更 - ${(e as Error).message}`);
    }
  }

  // 检查 task_plan.md 中是否有并行修复标记
  const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (exists(taskPlanPath)) {
    const content = readMarkdown(taskPlanPath).toLowerCase();
    if (content.includes('[p]') || content.includes('[parallel]') || content.includes('并行')) {
      reasons.push('存在并行任务标记');
      requiresWorktree = true;
    }
  }

  return {
    isHighRisk: reasons.length > 0,
    reasons,
    requiresWorktree,
  };
}

export function evaluateSkillHardGate(skillName: string, projectRoot: string): HardGateDecision {
  const expectedStage = HARD_GATE_STAGE_REQUIREMENTS[skillName];
  const requiresContext = Boolean(expectedStage) || skillName === 'orchestrate';

  if (!requiresContext) {
    return {
      allowed: true,
      severity: 'PASS',
      reason: 'skill does not require HARD-GATE',
      remediation: 'none',
    };
  }

  const featureId = readCurrentFeature(projectRoot);
  if (!featureId) {
    return {
      allowed: false,
      severity: 'BLOCKED',
      reason: `skill=${skillName} requires current feature pointer (.spec-first/current)`,
      remediation: '先在 P0 定位当前 Feature，再继续执行 HARD-GATE 校验',
    };
  }

  const currentStage = readCurrentStage(projectRoot, featureId);
  if (!currentStage) {
    return {
      allowed: false,
      severity: 'BLOCKED',
      reason: `skill=${skillName} requires stage-state.json`,
      remediation: '补齐 stage-state.json 或重新初始化 Feature',
    };
  }

  if (expectedStage && currentStage !== expectedStage) {
    return {
      allowed: false,
      severity: 'BLOCKED',
      reason: `skill=${skillName} requires stage=${expectedStage}, current=${currentStage}`,
      remediation: `返回目标阶段 ${expectedStage}，禁止直接进入实施动作`,
    };
  }

  const specDir = join(projectRoot, 'specs', featureId);
  if (skillName === 'design' && !exists(join(specDir, 'spec.md'))) {
    return {
      allowed: false,
      severity: 'BLOCKED',
      reason: 'design requires specs/{featureId}/spec.md',
      remediation: '先补齐需求规格产物 spec.md，再继续设计阶段',
    };
  }

  if (skillName === 'code') {
    if (!exists(join(specDir, 'design.md'))) {
      return {
        allowed: false,
        severity: 'BLOCKED',
        reason: 'code requires specs/{featureId}/design.md',
        remediation: '先完成 design 产物并通过相关校验',
      };
    }

    const taskPlanPath = join(specDir, 'task_plan.md');
    if (!exists(taskPlanPath)) {
      return {
        allowed: false,
        severity: 'BLOCKED',
        reason: 'code requires specs/{featureId}/task_plan.md',
        remediation: '先补齐 task_plan.md 并标记当前执行任务',
      };
    }

    const taskPlan = readMarkdown(taskPlanPath);
    if (!hasInProgressTask(taskPlan)) {
      return {
        allowed: false,
        severity: 'BLOCKED',
        reason: 'code requires an in_progress TASK',
        remediation: '先在 task_plan.md 标记 1 条 in_progress TASK，再进入实现',
      };
    }
  }

  // Worktree First 运行时守卫（Superpowers P1-3）
  if (skillName === 'code' || skillName === 'orchestrate') {
    const currentBranch = getCurrentGitBranch(projectRoot);
    const highRiskAssessment = assessHighRiskChanges(projectRoot, featureId);
    const inLinkedWorktree = isLinkedWorktree(projectRoot);
    const worktreeConfirmed = hasWorktreeConfirmed(specDir);

    // 在保护分支 + 高风险变更 → 强制要求 worktree 或显式确认
    if (isProtectedBranch(currentBranch) && highRiskAssessment.requiresWorktree) {
      if (!inLinkedWorktree && !worktreeConfirmed) {
        return {
          allowed: false,
          severity: 'BLOCKED',
          reason: `高风险操作检测: 当前在 ${currentBranch} 分支，${highRiskAssessment.reasons.join('; ')}`,
          remediation: '请切换到 git worktree 后重试，或在 task_plan.md 添加 [WORKTREE-CONFIRMED] 明确确认',
          highRiskAssessment,
        };
      }

      return {
        allowed: true,
        severity: 'WARN',
        reason: `高风险操作已确认: 分支=${currentBranch}，${highRiskAssessment.reasons.join('; ')}`,
        remediation: inLinkedWorktree
          ? '已在 git worktree 中执行，请继续保持隔离工作区'
          : '检测到 [WORKTREE-CONFIRMED]，请确保后续变更具备可回滚策略',
        highRiskAssessment,
      };
    }

    // 普通情况也返回风险评估
    return {
      allowed: true,
      severity: highRiskAssessment.isHighRisk ? 'WARN' : 'PASS',
      reason: `stage and prerequisites satisfied for ${skillName}`,
      remediation: highRiskAssessment.isHighRisk
        ? `检测到高风险信号：${highRiskAssessment.reasons.join('; ')}。建议使用 worktree。`
        : 'none',
      highRiskAssessment,
    };
  }

  return {
    allowed: true,
    severity: 'PASS',
    reason: `stage and prerequisites satisfied for ${skillName}`,
    remediation: 'none',
  };
}

export function buildHardGateRuntimeNotice(skillName: string, projectRoot: string): string | undefined {
  if (!HARD_GATE_STAGE_REQUIREMENTS[skillName] && skillName !== 'orchestrate') return undefined;

  const decision = evaluateSkillHardGate(skillName, projectRoot);
  const status = decision.severity;
  const action = status === 'BLOCKED'
    ? '当前仅允许执行定位与补齐动作，禁止实施写入。'
    : status === 'WARN'
      ? '允许继续，但需优先处理风险提示后再实施写入。'
      : '可以继续执行实现相关动作。';

  const lines = [
    '## HARD-GATE 运行时检查（自动）',
    `- Skill: ${skillName}`,
    `- 检查结果: ${status}`,
    `- 详情: ${decision.reason}`,
    `- 处置: ${decision.remediation}`,
    `- 约束: ${action}`,
  ];

  if (decision.highRiskAssessment?.isHighRisk) {
    lines.push(`- 风险: ${decision.highRiskAssessment.reasons.join('; ')}`);
  }

  return lines.join('\n');
}
