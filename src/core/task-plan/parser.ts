import { join } from 'node:path';
import type { TaskNode } from '../batch-executor/types.js';
import { exists, readMarkdown } from '../../shared/fs-utils.js';

export type ParsedTaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface ParsedTaskPlanTask {
  title: string;
  status: ParsedTaskStatus;
  summary?: string;
  next_step?: string;
  owner?: string;
  notes?: string;
}

export interface ParsedTaskPlan {
  tasks: ParsedTaskPlanTask[];
  currentTaskTitle?: string;
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    blocked: number;
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
  return cell.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeTaskPlanStatus(value: string): ParsedTaskStatus {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

  if (['done', 'complete', 'completed', 'verified'].includes(normalized)) return 'done';
  if (['in_progress', 'inprogress', 'doing', '进行中'].includes(normalized)) return 'in_progress';
  if (['blocked', 'halted'].includes(normalized)) return 'blocked';
  return 'todo';
}

function resolveColumnIndex(
  headers: string[],
  kind: 'title' | 'status' | 'summary' | 'next_step' | 'owner' | 'notes'
): number {
  const aliases = {
    title: ['title', '标题'],
    status: ['status', '状态'],
    summary: ['summary', '进展', '摘要'],
    next_step: ['next_step', 'nextstep', '下一步'],
    owner: ['owner', '负责人'],
    notes: ['notes', '备注'],
  }[kind];

  for (const alias of aliases) {
    const index = headers.findIndex((header) => header === alias);
    if (index !== -1) return index;
  }

  return -1;
}

export function parseTaskPlanContent(content: string): ParsedTaskPlan {
  const lines = content.split('\n');
  const tasks: ParsedTaskPlanTask[] = [];

  for (let index = 0; index < lines.length - 1; index++) {
    const header = lines[index]?.trim() ?? '';
    const divider = lines[index + 1]?.trim() ?? '';
    if (!header.startsWith('|') || !divider.startsWith('|') || !/^\|[\s\-:|]+$/.test(divider)) {
      continue;
    }

    const headers = splitMarkdownRow(header).map(normalizeHeader);
    const titleIdx = resolveColumnIndex(headers, 'title');
    const statusIdx = resolveColumnIndex(headers, 'status');
    if (titleIdx === -1 || statusIdx === -1) continue;

    const summaryIdx = resolveColumnIndex(headers, 'summary');
    const nextStepIdx = resolveColumnIndex(headers, 'next_step');
    const ownerIdx = resolveColumnIndex(headers, 'owner');
    const notesIdx = resolveColumnIndex(headers, 'notes');

    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      const rowLine = lines[rowIndex]?.trim() ?? '';
      if (!rowLine.startsWith('|')) break;

      const row = splitMarkdownRow(rowLine);
      const title = row[titleIdx]?.trim();
      if (!title || title === '-') continue;

      tasks.push({
        title,
        status: normalizeTaskPlanStatus(row[statusIdx] ?? ''),
        summary: summaryIdx === -1 ? undefined : (row[summaryIdx] ?? '').trim() || undefined,
        next_step: nextStepIdx === -1 ? undefined : (row[nextStepIdx] ?? '').trim() || undefined,
        owner: ownerIdx === -1 ? undefined : (row[ownerIdx] ?? '').trim() || undefined,
        notes: notesIdx === -1 ? undefined : (row[notesIdx] ?? '').trim() || undefined,
      });
    }

    if (tasks.length > 0) break;
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    done: tasks.filter((task) => task.status === 'done').length,
    blocked: tasks.filter((task) => task.status === 'blocked').length,
  };

  return {
    tasks,
    currentTaskTitle: tasks.find((task) => task.status === 'in_progress')?.title,
    stats,
  };
}

export function readTaskPlan(projectRoot: string, featureId: string): ParsedTaskPlan | null {
  const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!exists(taskPlanPath)) return null;
  return parseTaskPlanContent(readMarkdown(taskPlanPath));
}

export function getCurrentTaskTitle(projectRoot: string, featureId: string): string | undefined {
  return readTaskPlan(projectRoot, featureId)?.currentTaskTitle;
}

export function toTaskNodes(plan: ParsedTaskPlan): TaskNode[] {
  return plan.tasks.map((task) => ({
    id: task.title,
    title: task.title,
    description: task.summary ?? '',
    acceptanceCriteria: [],
    dependsOn: [],
    status: task.status,
    relatedFR: [],
    relatedDS: [],
  }));
}
