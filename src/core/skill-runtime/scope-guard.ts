import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { readFirstStageViews } from './first-runtime-store.js';

const SCOPE_GUARD_SKILLS = new Set(['code', 'review', 'verify']);
const TASK_SECTION_RE = /^###\s*(TASK-[A-Z0-9-]+)\b.*$/gm;

export interface ScopeGuardDecision {
  active: boolean;
  blocked: boolean;
  reason?: string;
  changedFiles: string[];
  unmatchedFiles: string[];
  taskFiles: string[];
  codeViewEntryPoints: string[];
  codeViewAreas: string[];
}

export class ScopeGuardBlockedError extends Error {
  readonly unmatchedFiles: string[];

  constructor(skillName: string, unmatchedFiles: string[]) {
    super(`SCOPE-GUARD-BLOCKED: ${skillName} has out-of-scope changes (${unmatchedFiles.join(', ')})`);
    this.name = 'ScopeGuardBlockedError';
    this.unmatchedFiles = unmatchedFiles;
  }
}

function readCurrentFeature(projectRoot: string): string | undefined {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentPath)) return undefined;
  const value = readMarkdown(currentPath).trim();
  return value || undefined;
}

function normalizeTaskStatus(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]+/g, '_');
}

function readCurrentTaskId(taskPlanContent: string): string | undefined {
  const lines = taskPlanContent.split('\n');
  const headerLine = lines.find((line) => line.trim().startsWith('|') && /task id/i.test(line) && /状态|status/i.test(line));
  if (!headerLine) return undefined;
  const headers = headerLine.split('|').slice(1, -1).map((cell) => cell.trim().toLowerCase());
  const taskIdx = headers.findIndex((cell) => cell === 'task id' || cell === 'task');
  const statusIdx = headers.findIndex((cell) => cell === '状态' || cell === 'status');
  if (taskIdx === -1 || statusIdx === -1) return undefined;

  const startIndex = lines.indexOf(headerLine);
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    if (/^\|[\s\-:|]+$/.test(trimmed)) continue;
    const cells = trimmed.split('|').slice(1, -1).map((cell) => cell.trim());
    const status = normalizeTaskStatus(cells[statusIdx] ?? '');
    if (status !== 'in_progress') continue;
    const taskIdMatch = (cells[taskIdx] ?? '').match(/TASK-[A-Z0-9-]+/i);
    if (taskIdMatch?.[0]) return taskIdMatch[0].toUpperCase();
  }
  return undefined;
}

function readTaskSection(taskPlanContent: string, taskId: string): string | undefined {
  const sections = [...taskPlanContent.matchAll(TASK_SECTION_RE)];
  if (sections.length === 0) return undefined;
  for (let i = 0; i < sections.length; i += 1) {
    const match = sections[i];
    const currentId = match[1]?.toUpperCase();
    if (currentId !== taskId) continue;
    const start = match.index ?? 0;
    const end = i + 1 < sections.length ? (sections[i + 1].index ?? taskPlanContent.length) : taskPlanContent.length;
    return taskPlanContent.slice(start, end);
  }
  return undefined;
}

function parseTaskFiles(taskSection: string | undefined): string[] {
  if (!taskSection) return [];
  const fileListMarker = taskSection.indexOf('**文件清单**');
  if (fileListMarker === -1) return [];
  const afterMarker = taskSection.slice(fileListMarker);
  const endCandidates = [afterMarker.indexOf('**执行步骤**'), afterMarker.indexOf('\n### ')].filter((idx) => idx > 0);
  const sliceEnd = endCandidates.length > 0 ? Math.min(...endCandidates) : afterMarker.length;
  const block = afterMarker.slice(0, sliceEnd);
  const refs = [...block.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? '');
  const normalized = refs
    .map((value) => value.trim().replace(/\\/g, '/'))
    .map((value) => value.split(':')[0] ?? value)
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function hasGitRepo(projectRoot: string): boolean {
  return exists(join(projectRoot, '.git'));
}

function runGit(projectRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf-8',
    timeout: 2000,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

function listChangedFiles(projectRoot: string): string[] {
  if (!hasGitRepo(projectRoot)) return [];
  const changed = new Set<string>();

  try {
    const withHead = runGit(projectRoot, ['rev-parse', '--verify', 'HEAD']);
    if (withHead) {
      const tracked = runGit(projectRoot, ['diff', '--name-only', 'HEAD']);
      tracked.split('\n').map((line) => line.trim()).filter(Boolean).forEach((file) => changed.add(file));
    }
  } catch {
    // ignore: repo may not have HEAD yet
  }

  try {
    const staged = runGit(projectRoot, ['diff', '--cached', '--name-only']);
    staged.split('\n').map((line) => line.trim()).filter(Boolean).forEach((file) => changed.add(file));
  } catch {
    // ignore
  }

  try {
    const untracked = runGit(projectRoot, ['ls-files', '--others', '--exclude-standard']);
    untracked.split('\n').map((line) => line.trim()).filter(Boolean).forEach((file) => changed.add(file));
  } catch {
    // ignore
  }

  return [...changed];
}

function isIgnoredRuntimeFile(file: string, featureId: string | undefined): boolean {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.startsWith('.spec-first/')) return true;
  if (!featureId) return false;
  const runtimeFiles = [
    `specs/${featureId}/findings.md`,
    `specs/${featureId}/task_plan.md`,
    `specs/${featureId}/gate-history.jsonl`,
    `specs/${featureId}/ai-stats.jsonl`,
    `specs/${featureId}/metrics.jsonl`,
  ];
  return runtimeFiles.includes(normalized);
}

function toDirPrefix(pathValue: string): string {
  return pathValue.endsWith('/') ? pathValue : `${pathValue}/`;
}

function isAllowedFile(file: string, taskFiles: string[], entryPoints: string[], areas: string[]): boolean {
  const normalized = file.replace(/\\/g, '/');
  if (taskFiles.includes(normalized)) return true;
  if (entryPoints.includes(normalized)) return true;
  return areas.some((area) => normalized === area || normalized.startsWith(toDirPrefix(area)));
}

export function evaluateRuntimeScopeGuard(skillName: string, projectRoot: string): ScopeGuardDecision {
  if (!SCOPE_GUARD_SKILLS.has(skillName)) {
    return {
      active: false,
      blocked: false,
      changedFiles: [],
      unmatchedFiles: [],
      taskFiles: [],
      codeViewEntryPoints: [],
      codeViewAreas: [],
    };
  }

  const featureId = readCurrentFeature(projectRoot);
  if (!featureId) {
    return {
      active: false,
      blocked: false,
      changedFiles: [],
      unmatchedFiles: [],
      taskFiles: [],
      codeViewEntryPoints: [],
      codeViewAreas: [],
    };
  }

  const taskPlanPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!exists(taskPlanPath)) {
    return {
      active: false,
      blocked: false,
      changedFiles: [],
      unmatchedFiles: [],
      taskFiles: [],
      codeViewEntryPoints: [],
      codeViewAreas: [],
    };
  }

  const taskPlan = readMarkdown(taskPlanPath);
  const currentTaskId = readCurrentTaskId(taskPlan);
  if (!currentTaskId) {
    return {
      active: false,
      blocked: false,
      changedFiles: [],
      unmatchedFiles: [],
      taskFiles: [],
      codeViewEntryPoints: [],
      codeViewAreas: [],
    };
  }

  const taskFiles = parseTaskFiles(readTaskSection(taskPlan, currentTaskId));
  if (taskFiles.length === 0) {
    return {
      active: false,
      blocked: false,
      changedFiles: [],
      unmatchedFiles: [],
      taskFiles: [],
      codeViewEntryPoints: [],
      codeViewAreas: [],
    };
  }

  const stageViews = readFirstStageViews(projectRoot);
  const codeViewEntryPoints = stageViews?.code?.entryPoints?.map((entry) => entry.replace(/\\/g, '/')) ?? [];
  const codeViewAreas = stageViews?.code?.likelyChangeAreas?.map((area) => area.replace(/\\/g, '/')) ?? [];
  const changedFiles = listChangedFiles(projectRoot)
    .map((file) => file.replace(/\\/g, '/'))
    .filter((file) => !isIgnoredRuntimeFile(file, featureId));

  const unmatchedFiles = changedFiles.filter((file) => !isAllowedFile(file, taskFiles, codeViewEntryPoints, codeViewAreas));

  return {
    active: true,
    blocked: unmatchedFiles.length > 0,
    reason: unmatchedFiles.length > 0 ? `Detected out-of-scope changes: ${unmatchedFiles.join(', ')}` : undefined,
    changedFiles,
    unmatchedFiles,
    taskFiles,
    codeViewEntryPoints,
    codeViewAreas,
  };
}

export function buildScopeGuardRuntimeNotice(decision: ScopeGuardDecision): string | undefined {
  if (!decision.active) return undefined;
  const parts = [
    '<!-- scope-guard-runtime-context -->',
    '## Scope Guard',
    `status: ${decision.blocked ? 'blocked' : 'pass'}`,
  ];

  if (decision.taskFiles.length > 0) {
    parts.push(`task_files: ${decision.taskFiles.join(', ')}`);
  }
  if (decision.codeViewEntryPoints.length > 0) {
    parts.push(`code_view_entry_points: ${decision.codeViewEntryPoints.join(', ')}`);
  }
  if (decision.codeViewAreas.length > 0) {
    parts.push(`code_view_areas: ${decision.codeViewAreas.join(', ')}`);
  }
  if (decision.changedFiles.length > 0) {
    parts.push(`changed_files: ${decision.changedFiles.join(', ')}`);
  }
  if (decision.unmatchedFiles.length > 0) {
    parts.push(`out_of_scope_changes: ${decision.unmatchedFiles.join(', ')}`);
  }

  parts.push('<!-- /scope-guard-runtime-context -->');
  return parts.join('\n');
}
