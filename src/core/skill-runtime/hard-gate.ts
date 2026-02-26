import { join } from 'node:path';
import { exists, readJson, readMarkdown } from '../../shared/fs-utils.js';
import type { StageState } from '../../shared/types.js';
import { execSync } from 'node:child_process';

const HARD_GATE_STAGE_REQUIREMENTS: Record<string, string> = {
  design: '02_design',
  code: '04_implement',
  orchestrate: '04_implement', // Superpowers P1-3: orchestrate 也需要 code 阶段守卫
};

/** 高风险变更判定（Superpowers P1-3） */
export interface HighRiskAssessment {
  isHighRisk: boolean;
  reasons: string[];
  requiresWorktree: boolean;
}

export interface HardGateDecision {
  allowed: boolean;
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
    const state = readJson<StageState>(statePath);
    return state.currentStage;
  } catch {
    return undefined;
  }
}

function parseMarkdownTableCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return [];

  const rawCells = trimmed.split('|').map(cell => cell.trim());
  // 兼容有无首尾分隔符的 Markdown 表格行
  if (rawCells[0] === '') rawCells.shift();
  if (rawCells[rawCells.length - 1] === '') rawCells.pop();
  return rawCells;
}

function isSeparatorRow(cells: string[]): boolean {
  if (cells.length === 0) return false;
  return cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function hasInProgressTask(taskPlan: string): boolean {
  const lines = taskPlan.split('\n');
  for (const line of lines) {
    const cells = parseMarkdownTableCells(line);
    if (cells.length === 0 || isSeparatorRow(cells)) continue;

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

/** 检测当前 Git 分支（Superpowers P1-3） */
function getCurrentGitBranch(projectRoot: string): string | undefined {
  try {
    const output = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output || undefined;
  } catch {
    return undefined;
  }
}

/** 判断是否为保护分支（main/master） */
function isProtectedBranch(branch: string | undefined): boolean {
  if (!branch) return false;
  const protectedBranches = ['main', 'master', 'mainline', 'production', 'prod'];
  return protectedBranches.includes(branch.toLowerCase());
}

/** 高风险变更评估（Superpowers P1-3） */
function assessHighRiskChanges(projectRoot: string, featureId: string): HighRiskAssessment {
  const reasons: string[] = [];
  let requiresWorktree = false;

  // 检查是否有跨目录重构信号
  try {
    const diffOutput = execSync('git diff --name-only HEAD~5 2>/dev/null || echo ""', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

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
  } catch {
    // Git 不可用时跳过
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
  if (!expectedStage) {
    return { allowed: true, reason: 'skill does not require HARD-GATE', remediation: 'none' };
  }

  const featureId = readCurrentFeature(projectRoot);
  if (!featureId) {
    return {
      allowed: false,
      reason: `skill=${skillName} requires current feature pointer (.spec-first/current)`,
      remediation: '先在 P0 定位当前 Feature，再继续执行 HARD-GATE 校验',
    };
  }

  const currentStage = readCurrentStage(projectRoot, featureId);
  if (!currentStage) {
    return {
      allowed: false,
      reason: `skill=${skillName} requires stage-state.json`,
      remediation: '补齐 stage-state.json 或重新初始化 Feature',
    };
  }

  if (currentStage !== expectedStage) {
    return {
      allowed: false,
      reason: `skill=${skillName} requires stage=${expectedStage}, current=${currentStage}`,
      remediation: `返回目标阶段 ${expectedStage}，禁止直接进入实施动作`,
    };
  }

  const specDir = join(projectRoot, 'specs', featureId);
  if (skillName === 'design' && !exists(join(specDir, 'spec.md'))) {
    return {
      allowed: false,
      reason: 'design requires specs/{featureId}/spec.md',
      remediation: '先补齐需求规格产物 spec.md，再继续设计阶段',
    };
  }

  if (skillName === 'code') {
    if (!exists(join(specDir, 'design.md'))) {
      return {
        allowed: false,
        reason: 'code requires specs/{featureId}/design.md',
        remediation: '先完成 design 产物并通过相关校验',
      };
    }

    const taskPlanPath = join(specDir, 'task_plan.md');
    if (!exists(taskPlanPath)) {
      return {
        allowed: false,
        reason: 'code requires specs/{featureId}/task_plan.md',
        remediation: '先补齐 task_plan.md 并标记当前执行任务',
      };
    }

    const taskPlan = readMarkdown(taskPlanPath);
    if (!hasInProgressTask(taskPlan)) {
      return {
        allowed: false,
        reason: 'code requires an in_progress TASK',
        remediation: '先在 task_plan.md 标记 1 条 in_progress TASK，再进入实现',
      };
    }
  }

  // Worktree First 运行时守卫（Superpowers P1-3）
  if (skillName === 'code' || skillName === 'orchestrate') {
    const currentBranch = getCurrentGitBranch(projectRoot);
    const highRiskAssessment = assessHighRiskChanges(projectRoot, featureId);

    // 在保护分支 + 高风险变更 → 建议使用 worktree
    if (isProtectedBranch(currentBranch) && highRiskAssessment.requiresWorktree) {
      return {
        allowed: true, // 不阻断，但给出强警告
        reason: `高风险操作检测: 当前在 ${currentBranch} 分支，${highRiskAssessment.reasons.join('; ')}`,
        remediation: '建议使用 git worktree 创建独立工作区，或在 task_plan.md 中添加 [WORKTREE-CONFIRMED] 标记',
        highRiskAssessment,
      };
    }

    // 普通情况也返回风险评估
    return {
      allowed: true,
      reason: `stage and prerequisites satisfied for ${skillName}`,
      remediation: 'none',
      highRiskAssessment,
    };
  }

  return {
    allowed: true,
    reason: `stage and prerequisites satisfied for ${skillName}`,
    remediation: 'none',
  };
}

export function buildHardGateRuntimeNotice(skillName: string, projectRoot: string): string | undefined {
  if (!HARD_GATE_STAGE_REQUIREMENTS[skillName]) return undefined;

  const decision = evaluateSkillHardGate(skillName, projectRoot);
  const status = decision.allowed ? 'PASS' : 'BLOCKED';
  const action = decision.allowed
    ? '可以继续执行实现相关动作。'
    : '当前仅允许执行定位与补齐动作，禁止实施写入。';

  return [
    '## HARD-GATE 运行时检查（自动）',
    `- Skill: ${skillName}`,
    `- 检查结果: ${status}`,
    `- 详情: ${decision.reason}`,
    `- 处置: ${decision.remediation}`,
    `- 约束: ${action}`,
  ].join('\n');
}
