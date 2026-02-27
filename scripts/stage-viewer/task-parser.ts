/**
 * Task Plan Parser - 解析 task_plan.md 文件
 * 提取为独立模块便于测试
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TaskItem {
  id: string;
  title: string;
  status: 'complete' | 'in_progress' | 'pending';
}

export interface Phase {
  id: string;
  title: string;
  status: string;
  tasks: TaskItem[];
}

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  progress: number;
}

export interface TaskPlanResult {
  phases: Phase[];
  tasks: TaskItem[];
  stats: TaskStats;
  currentTasks: TaskItem[];
}

/**
 * 标准化任务状态
 */
export function normalizeTaskStatus(status: string): TaskItem['status'] {
  const s = status.toLowerCase().trim();
  if (s === 'complete' || s === 'completed' || s === 'done') return 'complete';
  if (s === 'in_progress' || s === 'in-progress' || s === 'in progress' || s === 'wip') return 'in_progress';
  return 'pending';
}

/**
 * 解析 task_plan.md 文件
 */
export function parseTaskPlan(projectRoot: string, featureId: string): TaskPlanResult | null {
  const taskPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!existsSync(taskPath)) return null;

  const content = readFileSync(taskPath, 'utf-8');
  const tasks: TaskItem[] = [];
  const phases: Phase[] = [];

  // 解析阶段 (### Phase N: Title)
  const phaseRegex = /### (Phase \d+):\s*(.+?)\n([\s\S]*?)(?=### Phase|\n## |$)/g;
  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(content)) !== null) {
    const phaseId = phaseMatch[1];
    const phaseTitle = phaseMatch[2].trim();
    const phaseContent = phaseMatch[3];

    // 提取阶段状态
    const statusMatch = phaseContent.match(/\*\*Status:\*\*\s*(\w+)/);
    const phaseStatus = statusMatch ? statusMatch[1] : 'pending';

    // 提取阶段内的任务
    const taskRegex = /-\s*\[([ x])\]\s*(TASK-\w+-\d+)\s+(.+)/g;
    let taskMatch;
    const phaseTasks: TaskItem[] = [];
    while ((taskMatch = taskRegex.exec(phaseContent)) !== null) {
      const checked = taskMatch[1] === 'x';
      const taskId = taskMatch[2];
      const taskTitle = taskMatch[3].trim();
      phaseTasks.push({
        id: taskId,
        title: taskTitle,
        status: checked ? 'complete' : 'pending',
      });
    }

    phases.push({
      id: phaseId,
      title: phaseTitle,
      status: phaseStatus,
      tasks: phaseTasks,
    });
  }

  // 解析任务明细表格
  const tableRegex = /\|\s*TASK ID\s*\|[\s\S]*?\n([\s\S]*?)(?=\n## |\n$)/;
  const tableMatch = content.match(tableRegex);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n').filter(row => row.includes('TASK-'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 8) {
        const taskId = cols[0];
        const title = cols[1];
        const status = cols[7] || 'pending';

        tasks.push({
          id: taskId,
          title,
          status: normalizeTaskStatus(status),
        });
      }
    }
  }

  // 计算统计
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'complete').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 找出当前进行中的任务
  const currentTasks = tasks.filter(t => t.status === 'in_progress');

  return {
    phases,
    tasks,
    stats: {
      total,
      completed,
      inProgress,
      pending,
      progress,
    },
    currentTasks,
  };
}

/**
 * 从追踪矩阵推断覆盖率（简化版本）
 */
export interface CoverageMetrics {
  C1: number;
  C2: number;
  C3: number;
  C4: number;
  C5: number;
  C6: number;
  C7: number;
  C8: number;
  C9: number;
}

export function getDefaultMetrics(featureId: string, projectRoot: string): CoverageMetrics {
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');
  const metrics: CoverageMetrics = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0, C7: 1, C8: 1, C9: 1 };

  if (existsSync(matrixPath)) {
    const content = readFileSync(matrixPath, 'utf-8');
    // 统计 FR/DS/TASK/TC 数量
    const frCount = (content.match(/\| FR-/g) || []).length;
    const dsCount = (content.match(/\| DS-/g) || []).length;
    const taskCount = (content.match(/\| TASK-/g) || []).length;
    const tcCount = (content.match(/\| TC-/g) || []).length;

    if (frCount > 0) {
      metrics.C1 = Math.min(dsCount / frCount, 1);
      metrics.C2 = metrics.C1;
      metrics.C3 = Math.min(taskCount / frCount, 1);
      metrics.C4 = Math.min(tcCount / frCount, 1);
      metrics.C5 = metrics.C4;
    }
    if (taskCount > 0) {
      // 检查实现状态
      const implemented = (content.match(/Implemented|Verified|Accepted/g) || []).length;
      metrics.C6 = Math.min(implemented / taskCount, 1);
    }
  }

  return metrics;
}

/**
 * 健康分数计算
 */
export interface HealthResult {
  H1: number;
  grade: string;
  breakdown: Record<string, number>;
}

const WEIGHTS: Record<string, number> = {
  C1: 0.12, C2: 0.10, C3: 0.10, C4: 0.15,
  C5: 0.10, C6: 0.13, C7: 0.10, C8: 0.10, C9: 0.10,
};

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function calcHealthScore(coverage: Partial<CoverageMetrics>, escapeRate = 0): HealthResult {
  let weighted = 0;
  const breakdown: Record<string, number> = {};

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const val = Math.min(coverage[key as keyof CoverageMetrics] ?? 0, 1.0);
    breakdown[key] = val * weight * 100;
    weighted += val * weight;
  }

  const penalty = Math.min(escapeRate * 200, 50);
  const rawH1 = Math.max(0, Math.min(100, weighted * 100 - penalty));
  const H1 = Math.round(rawH1 * 10) / 10;

  return {
    H1,
    grade: getGrade(H1),
    breakdown,
  };
}
