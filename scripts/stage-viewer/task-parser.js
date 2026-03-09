/**
 * Task Plan Parser - 解析 task_plan.md 文件
 * 纯 JS 版本，供 server.js 和测试使用
 *
 * 注意：此文件与 task-parser.ts 需要保持同步
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 标准化任务状态
 * @param {string} status
 * @returns {'complete' | 'in_progress' | 'pending'}
 */
export function normalizeTaskStatus(status) {
  const s = status.toLowerCase().trim();
  if (s === 'complete' || s === 'completed' || s === 'done') return 'complete';
  if (s === 'in_progress' || s === 'in-progress' || s === 'in progress' || s === 'wip' || s === 'doing') return 'in_progress';
  if (s === 'blocked' || s === 'skipped' || s === 'cancelled') return 'pending';
  return 'pending';
}

/**
 * 解析 task_plan.md 文件
 * @param {string} projectRoot
 * @param {string} featureId
 * @returns {{ phases: object[], tasks: object[], stats: object, currentTasks: object[] } | null}
 */
export function parseTaskPlan(projectRoot, featureId) {
  const taskPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!existsSync(taskPath)) return null;

  const content = readFileSync(taskPath, 'utf-8');
  const tasks = [];
  const phases = [];

  // 解析阶段 (### Phase N: Title)
  const phaseRegex = /### (Phase \d+):\s*(.+?)\n([\s\S]*?)(?=### Phase|\n## |$)/g;
  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(content)) !== null) {
    const phaseId = phaseMatch[1];
    const phaseTitle = phaseMatch[2].trim();
    const phaseContent = phaseMatch[3];

    // 提取阶段状态
    const statusMatch = phaseContent.match(/\*\*Status:\*\*\s*(\w+)/);
    const phaseStatus = statusMatch ? normalizeTaskStatus(statusMatch[1]) : 'pending';

    // 提取阶段内的任务
    const taskRegex = /-\s*\[([ x])\]\s*(TASK-\w+-\d+)\s+(.+)/g;
    let taskMatch;
    const phaseTasks = [];
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
      if (cols.length >= 7) {
        const taskId = cols[0];
        const title = cols[1];
        const owner = cols[2] || '-';
        const effort = cols[3] || '-';
        const traces = cols[4] || '';
        const dependsOn = cols[5] || '-';
        const acceptance = cols[6] || '-';
        const status = cols[7] || 'pending';

        tasks.push({
          id: taskId,
          title,
          owner,
          effort,
          traces: traces ? traces.split(',').map(t => t.trim()) : [],
          dependsOn: dependsOn && dependsOn !== '-' ? dependsOn.split(',').map(d => d.trim()) : [],
          acceptance,
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
