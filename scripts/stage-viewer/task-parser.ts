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
  if (s === 'in_progress' || s === 'in-progress' || s === 'in progress' || s === 'wip' || s === 'doing') return 'in_progress';
  if (s === 'blocked' || s === 'skipped' || s === 'cancelled') return 'pending';
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

    // 提取阶段状态：优先使用显式标记，否则根据任务完成情况推导
    const statusMatch = phaseContent.match(/\*\*Status:\*\*\s*(\w+)/);
    let phaseStatus: string;
    if (statusMatch) {
      phaseStatus = normalizeTaskStatus(statusMatch[1]);
    } else if (phaseTasks.length > 0) {
      // 根据任务完成情况推导阶段状态
      const allComplete = phaseTasks.every(t => t.status === 'complete');
      const anyInProgress = phaseTasks.some(t => t.status === 'in_progress');
      if (allComplete) {
        phaseStatus = 'complete';
      } else if (anyInProgress) {
        phaseStatus = 'in_progress';
      } else {
        phaseStatus = 'pending';
      }
    } else {
      phaseStatus = 'pending';
    }

    phases.push({
      id: phaseId,
      title: phaseTitle,
      status: phaseStatus,
      tasks: phaseTasks,
    });
  }

  // 解析任务明细表格（支持 Task ID 或 TASK ID）
  const tableRegex = /\|\s*(?:Task|TASK) ID\s*\|[\s\S]*?\n([\s\S]*?)(?=\n## |\n$)/;
  const tableMatch = content.match(tableRegex);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n').filter(row => row.includes('TASK-'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 7) {
        const taskId = cols[0];
        const title = cols[1];
        const status = cols[cols.length - 1] || 'pending';

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
 * 健康分数计算
 */
export interface HealthResult {
  H1: number;
  grade: string;
  breakdown: Record<string, number>;
}

// S5: 从共享模块 re-export，消除重复实现
export { getDefaultMetrics, calcHealthScore } from './health-utils.js';
