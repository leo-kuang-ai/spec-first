/**
 * Session Catchup — 6步恢复流程
 * 读取 stage-state → task_plan → findings → 定位 → 扫描缺失 → 输出摘要
 * Planning-with-Files P0-2: 5-Question Reboot Test 结构化输出
 */
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';
import { readJson, exists, readMarkdown } from '../../shared/fs-utils.js';
import { loadTodoState, summarizeTodoState } from './todo-runner.js';
import { buildTaskContextPack } from './context-pack.js';
import { buildCatchupSummary, extractFiveQuestions } from './catchup-summary.js';
import type { FiveQuestions } from './catchup-summary.js';
export type { FiveQuestions } from './catchup-summary.js';

export interface CatchupResult {
  featureId: string;
  currentPhase: string;
  currentTask?: string;
  taskContextSummary?: {
    taskId: string;
    contextSize: number;
    relatedFRCount: number;
    relatedDSCount: number;
    relatedAPICount: number;
  };
  completedTasks: number;
  totalTasks: number;
  todoSummary?: string;
  missingFiles: string[];
  /** 5-Question Reboot Test 结果（Planning-with-Files P0-2） */
  fiveQuestions: FiveQuestions;
  summary: string;
}

/** 自动触发策略 */
export type TriggerStrategy = 'auto' | 'prompt' | 'off';

/** 并发保护：60秒内不重复触发 */
const catchupLocks = new Map<string, number>();
const LOCK_TTL = 60_000;

/** 执行 6 步恢复流程 */
export function catchup(featureId: string, projectRoot: string): CatchupResult {
  // 并发保护
  const now = Date.now();
  const lastRun = catchupLocks.get(featureId) ?? 0;
  if (now - lastRun < LOCK_TTL) {
    // 即使跳过也需要提供 fiveQuestions
    const skipQuestions: FiveQuestions = {
      featureAndStage: { answer: `${featureId} @ unknown`, gap: true },
      currentTask: { answer: '无 in_progress 任务', gap: true },
      lastConclusion: { answer: '会话跳过', gap: true },
      currentBlocker: { answer: '无', gap: false },
      nextAction: { answer: '等待60秒冷却后重试', gap: true },
    };
    return {
      featureId,
      currentPhase: 'unknown',
      completedTasks: 0,
      totalTasks: 0,
      missingFiles: [],
      fiveQuestions: skipQuestions,
      summary: `已跳过会话恢复：距离上次仅 ${Math.round((now - lastRun) / 1000)}s（< 60s）`,
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

  // Step 3: Read findings.md
  const findingsPath = join(specDir, 'findings.md');
  let findingsContent = '';
  if (!exists(findingsPath)) {
    missingFiles.push('findings.md');
  } else {
    findingsContent = readMarkdown(findingsPath);
  }

  // Step 4: Locate current task
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

  // Step 4.2: 构建 TASK 级独立上下文包（Fresh Context Per Task）
  const taskContextPack = currentTask
    ? buildTaskContextPack(currentTask, featureId, projectRoot)
    : null;
  const taskContextSummary = taskContextPack
    ? {
      taskId: taskContextPack.taskId,
      contextSize: taskContextPack.contextSize,
      relatedFRCount: taskContextPack.relatedFR.length,
      relatedDSCount: taskContextPack.relatedDS.length,
      relatedAPICount: taskContextPack.relatedAPI.length,
    }
    : undefined;

  // Step 5: Scan required files for current stage
  const requiredFiles = getRequiredFiles(currentPhase);
  for (const f of requiredFiles) {
    const fullPath = join(specDir, f);
    if (!exists(fullPath)) {
      missingFiles.push(f);
    }
  }

  // 去重缺失文件，避免多步骤重复记录同一文件
  const uniqueMissingFiles = [...new Set(missingFiles)];

  // Step 5.1: Extract 5-Question answers (Planning-with-Files P0-2)
  // 必须在 requiredFiles 扫描后执行，确保 Q4 与最终缺失列表一致
  const fiveQuestions = extractFiveQuestions(
    featureId,
    currentPhase,
    currentTask,
    findingsContent,
    uniqueMissingFiles,
  );

  // Step 5.5: Todo Runner continuation state (P1-10)
  const todoState = loadTodoState(featureId, projectRoot);
  const todoSummary = todoState ? summarizeTodoState(todoState) : undefined;

  // Step 6: Output summary
  const summary = buildCatchupSummary(
    featureId,
    currentPhase,
    currentTask,
    completedTasks,
    totalTasks,
    uniqueMissingFiles,
    todoSummary,
    fiveQuestions,
    taskContextSummary,
  );

  return {
    featureId,
    currentPhase,
    currentTask,
    taskContextSummary,
    completedTasks,
    totalTasks,
    todoSummary,
    missingFiles: uniqueMissingFiles,
    fiveQuestions,
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
