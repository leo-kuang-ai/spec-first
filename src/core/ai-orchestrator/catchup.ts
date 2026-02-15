/**
 * Session Catchup — 7步恢复流程
 * 读取 stage-state → task_plan → progress → findings → 定位 → 扫描缺失 → 输出摘要
 */
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';
import { readJson, exists, readMarkdown } from '../../shared/fs-utils.js';

export interface CatchupResult {
  featureId: string;
  currentPhase: string;
  currentTask?: string;
  completedTasks: number;
  totalTasks: number;
  missingFiles: string[];
  summary: string;
}

/** 自动触发策略 */
export type TriggerStrategy = 'auto' | 'prompt' | 'off';

/** 并发保护：60秒内不重复触发 */
const catchupLocks = new Map<string, number>();
const LOCK_TTL = 60_000;

/** 执行 7 步恢复流程 */
export function catchup(featureId: string, projectRoot: string): CatchupResult {
  // 并发保护
  const now = Date.now();
  const lastRun = catchupLocks.get(featureId) ?? 0;
  if (now - lastRun < LOCK_TTL) {
    return {
      featureId,
      currentPhase: 'unknown',
      completedTasks: 0,
      totalTasks: 0,
      missingFiles: [],
      summary: `Catchup skipped: last run ${Math.round((now - lastRun) / 1000)}s ago (< 60s)`,
    };
  }
  catchupLocks.set(featureId, now);

  const specDir = join(projectRoot, 'specs', featureId);
  const missingFiles: string[] = [];

  // Step 1: Read stage-state.json
  const statePath = join(specDir, 'stage-state.json');
  let state: StageState | null = null;
  if (exists(statePath)) {
    state = readJson<StageState>(statePath);
  } else {
    missingFiles.push('stage-state.json');
  }

  const currentPhase = state?.currentStage ?? 'unknown';

  // Step 2: Read task_plan.md
  let totalTasks = 0;
  let completedTasks = 0;
  const taskPlanPath = join(specDir, 'task_plan.md');
  if (exists(taskPlanPath)) {
    const content = readMarkdown(taskPlanPath);
    const lines = content.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---'));
    totalTasks = Math.max(0, lines.length - 1); // exclude header
    completedTasks = content.split('\n').filter(l => l.includes('Done') || l.includes('Completed')).length;
  } else {
    missingFiles.push('task_plan.md');
  }

  // Step 3: Read progress.md
  const progressPath = join(specDir, 'progress.md');
  if (!exists(progressPath)) {
    missingFiles.push('progress.md');
  }

  // Step 4: Read findings.md
  const findingsPath = join(specDir, 'findings.md');
  if (!exists(findingsPath)) {
    missingFiles.push('findings.md');
  }

  // Step 5: Locate current task
  let currentTask: string | undefined;
  if (exists(taskPlanPath)) {
    const content = readMarkdown(taskPlanPath);
    const inProgress = content.split('\n').find(l =>
      l.includes('In Progress') || l.includes('进行中'),
    );
    if (inProgress) {
      const match = inProgress.match(/TASK-\S+/);
      currentTask = match?.[0];
    }
  }

  // Step 6: Scan required files for current stage
  const requiredFiles = getRequiredFiles(currentPhase);
  for (const f of requiredFiles) {
    const fullPath = join(specDir, f);
    if (!exists(fullPath)) {
      missingFiles.push(f);
    }
  }

  // Step 7: Output summary
  const summary = buildSummary(featureId, currentPhase, currentTask, completedTasks, totalTasks, missingFiles);

  return {
    featureId,
    currentPhase,
    currentTask,
    completedTasks,
    totalTasks,
    missingFiles,
    summary,
  };
}

/** 重置并发锁（测试用） */
export function resetLocks(): void {
  catchupLocks.clear();
}

function getRequiredFiles(stage: string): string[] {
  const base = ['stage-state.json', 'constitution.md', 'traceability-matrix.md'];
  switch (stage) {
    case '01_specify': return [...base, 'spec.md'];
    case '02_design': return [...base, 'design.md'];
    case '03_plan': return [...base, 'task_plan.md'];
    case '04_implement': return [...base, 'task_plan.md'];
    case '05_verify': return [...base, 'task_plan.md'];
    default: return base;
  }
}

function buildSummary(
  featureId: string, phase: string, task: string | undefined,
  completed: number, total: number, missing: string[],
): string {
  const lines = [
    `Session Catchup — ${featureId}`,
    `Phase: ${phase}`,
    task ? `Current Task: ${task}` : 'Current Task: none',
    `Progress: ${completed}/${total} tasks`,
  ];
  if (missing.length > 0) {
    lines.push(`Missing Files (${missing.length}): ${missing.join(', ')}`);
  } else {
    lines.push('Missing Files: none');
  }
  return lines.join('\n');
}
