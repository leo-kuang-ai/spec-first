import { join } from 'node:path';
import type { TaskNode } from '../batch-executor/types.js';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { splitCanonicalTraceIds } from '../trace-engine/relationship-graph.js';

export type ParsedTaskStatus = 'pending' | 'in_progress' | 'complete' | 'blocked';

export interface ParsedTaskPlanTask {
  id: string;
  title: string;
  status: ParsedTaskStatus;
  dependsOn: string[];
  traces: string[];
  owner?: string;
}

export interface ParsedTaskPlan {
  tasks: ParsedTaskPlanTask[];
  currentTaskId?: string;
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return [];
  const parts = trimmed.split('|').slice(1);
  if (parts.at(-1)?.trim() === '') parts.pop();
  return parts.map((cell) => cell.trim());
}

function normalizeHeader(cell: string): string {
  return cell.toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeTaskPlanStatus(value: string): ParsedTaskStatus {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
  if (['complete', 'completed', 'done', 'verified'].includes(normalized)) return 'complete';
  if (['in_progress', 'wip', 'doing', '进行中'].includes(normalized)) return 'in_progress';
  if (['blocked'].includes(normalized)) return 'blocked';
  return 'pending';
}

function resolveColumnIndex(
  headers: string[],
  kind: 'task_id' | 'title' | 'status' | 'depends_on' | 'traces' | 'owner'
): number {
  const exact = {
    task_id: ['task_id', 'taskid', 'id'],
    title: ['title', '标题'],
    status: ['status', '状态'],
    depends_on: ['depends_on', 'depends', '依赖', 'dependson'],
    traces: ['traces', 'trace', '关联', 'links'],
    owner: ['owner', '负责人'],
  }[kind];

  for (const candidate of exact) {
    const index = headers.findIndex((header) => header === candidate);
    if (index !== -1) return index;
  }

  if (kind === 'task_id') {
    return headers.findIndex((header) => header.includes('task') && header.includes('id'));
  }

  return -1;
}

export function parseTaskPlanContent(content: string): ParsedTaskPlan {
  const lines = content.split('\n');
  let headerCells: string[] | undefined;
  const tasks: ParsedTaskPlanTask[] = [];

  for (let index = 0; index < lines.length - 1; index++) {
    const header = lines[index]?.trim() ?? '';
    const divider = lines[index + 1]?.trim() ?? '';
    if (!header.startsWith('|') || !divider.startsWith('|') || !/^\|[\s\-:|]+$/.test(divider))
      continue;

    const rawHeaders = splitMarkdownRow(header);
    const normalizedHeaders = rawHeaders.map(normalizeHeader);
    const taskIdIdx = resolveColumnIndex(normalizedHeaders, 'task_id');
    const statusIdx = resolveColumnIndex(normalizedHeaders, 'status');
    if (taskIdIdx === -1 || statusIdx === -1) continue;

    headerCells = normalizedHeaders;
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      const rowLine = lines[rowIndex]?.trim() ?? '';
      if (!rowLine.startsWith('|')) break;
      const row = splitMarkdownRow(rowLine);
      if (row.length === 0) continue;
      const taskId = row[taskIdIdx]?.match(/TASK-[A-Z0-9-]+/i)?.[0];
      if (!taskId) continue;

      const titleIdx = resolveColumnIndex(normalizedHeaders, 'title');
      const dependsIdx = resolveColumnIndex(normalizedHeaders, 'depends_on');
      const tracesIdx = resolveColumnIndex(normalizedHeaders, 'traces');
      const ownerIdx = resolveColumnIndex(normalizedHeaders, 'owner');

      const dependsOn =
        dependsIdx === -1
          ? []
          : (row[dependsIdx] ?? '')
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item && item !== '-');
      const traces =
        tracesIdx === -1
          ? []
          : (row[tracesIdx] ?? '')
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item && item !== '-');

      tasks.push({
        id: taskId.toUpperCase(),
        title: titleIdx === -1 ? taskId : (row[titleIdx] ?? '').trim() || taskId,
        status: normalizeTaskPlanStatus(row[statusIdx] ?? ''),
        dependsOn,
        traces,
        owner: ownerIdx === -1 ? undefined : (row[ownerIdx] ?? '').trim() || undefined,
      });
    }

    if (tasks.length > 0) break;
  }

  if (!headerCells || tasks.length === 0) {
    return {
      tasks: [],
      stats: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    };
  }

  const currentTaskId = tasks.find((task) => task.status === 'in_progress')?.id;
  const completed = tasks.filter((task) => task.status === 'complete').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const pending = tasks.length - completed - inProgress;

  return {
    tasks,
    currentTaskId,
    stats: {
      total: tasks.length,
      completed,
      inProgress,
      pending,
    },
  };
}

export function readTaskPlan(projectRoot: string, featureId: string): ParsedTaskPlan | null {
  const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!exists(taskPlanPath)) return null;
  return parseTaskPlanContent(readMarkdown(taskPlanPath));
}

export function getCurrentTaskId(projectRoot: string, featureId: string): string | undefined {
  return readTaskPlan(projectRoot, featureId)?.currentTaskId;
}

export function toTaskNodes(plan: ParsedTaskPlan): TaskNode[] {
  return plan.tasks.map((task) => {
    const partitions = splitCanonicalTraceIds(task.traces);
    return {
      id: task.id,
      title: task.title,
      description: '',
      acceptanceCriteria: [],
      dependsOn: task.dependsOn,
      status:
        task.status === 'complete'
          ? 'done'
          : task.status === 'in_progress'
            ? 'in_progress'
            : task.status === 'blocked'
              ? 'blocked'
              : 'todo',
      relatedFR: partitions.relatedFRIds,
      relatedDS: partitions.relatedDSIds,
    };
  });
}
