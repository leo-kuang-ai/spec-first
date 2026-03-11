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

  // 解析阶段 (### Phase N: Title 或 ### US N — Title)
  const phaseRegex = /### ((?:Phase|US)\s*\d+)[:\s—]+(.+?)\n([\s\S]*?)(?=### (?:Phase|US)|\n## |$)/g;
  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(content)) !== null) {
    const phaseId = phaseMatch[1];
    const phaseTitle = phaseMatch[2].trim();
    const phaseContent = phaseMatch[3];

    // 提取阶段内的任务（支持 [P] [US1] 等标签）
    const taskRegex = /-\s*\[([ x])\]\s*(TASK-\w+-\d+)\s+(?:\[.*?\]\s*)*(.+)/g;
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

    // 提取阶段状态：优先使用显式标记，否则根据任务完成情况推导
    const statusMatch = phaseContent.match(/\*\*Status:\*\*\s*(\w+)/);
    let phaseStatus;
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
      // 支持 7、8、9 列格式
      if (cols.length >= 7) {
        const taskId = cols[0];
        const title = cols[1];
        const owner = cols[2] || '-';
        const effort = cols[3] || '-';
        const traces = cols[4] || '';
        const dependsOn = cols[5] || '-';
        const acceptance = cols[6] || '-';
        // 7 列格式：无 status 列，默认 pending
        // 8 列格式：最后一列是 status
        // 9 列格式：cols[8] 是 status
        let status = 'pending';
        if (cols.length === 7) {
          status = 'pending';
        } else if (cols.length === 8) {
          status = cols[7] || 'pending';
        } else {
          status = cols[8] || 'pending';
        }

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
