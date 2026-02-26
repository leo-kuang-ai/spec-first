/**
 * Session Catchup — 6步恢复流程
 * 读取 stage-state → task_plan → findings → 定位 → 扫描缺失 → 输出摘要
 * Planning-with-Files P0-2: 5-Question Reboot Test 结构化输出
 */
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';
import { readJson, exists, readMarkdown } from '../../shared/fs-utils.js';
import { loadTodoState, summarizeTodoState } from './todo-runner.js';

/** 5-Question Reboot Test 结构（Planning-with-Files P0-2） */
export interface FiveQuestions {
  /** Q1: 当前 Feature 与阶段是什么？ */
  featureAndStage: { answer: string; gap: boolean };
  /** Q2: 当前 in_progress TASK 是什么？ */
  currentTask: { answer: string; gap: boolean };
  /** Q3: 上次中断前最后一个有效结论是什么？ */
  lastConclusion: { answer: string; gap: boolean };
  /** Q4: 当前最大阻塞是什么？ */
  currentBlocker: { answer: string; gap: boolean };
  /** Q5: 下一步最小可执行命令是什么？ */
  nextAction: { answer: string; gap: boolean };
}

export interface CatchupResult {
  featureId: string;
  currentPhase: string;
  currentTask?: string;
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

  // Step 4.5: Extract 5-Question answers (Planning-with-Files P0-2)
  const fiveQuestions = extractFiveQuestions(
    featureId,
    currentPhase,
    currentTask,
    findingsContent,
    missingFiles,
  );

  // Step 5: Scan required files for current stage
  const requiredFiles = getRequiredFiles(currentPhase);
  for (const f of requiredFiles) {
    const fullPath = join(specDir, f);
    if (!exists(fullPath)) {
      missingFiles.push(f);
    }
  }

  // Step 5.5: Todo Runner continuation state (P1-10)
  const todoState = loadTodoState(featureId, projectRoot);
  const todoSummary = todoState ? summarizeTodoState(todoState) : undefined;

  // Step 6: Output summary
  const summary = buildSummary(featureId, currentPhase, currentTask, completedTasks, totalTasks, missingFiles, todoSummary, fiveQuestions);

  return {
    featureId,
    currentPhase,
    currentTask,
    completedTasks,
    totalTasks,
    todoSummary,
    missingFiles,
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

function buildSummary(
  featureId: string, phase: string, task: string | undefined,
  completed: number, total: number, missing: string[], todoSummary?: string,
  fiveQuestions?: FiveQuestions,
): string {
  const lines = [
    `会话恢复 — ${featureId}`,
    `阶段：${phase}`,
    task ? `当前任务：${task}` : '当前任务：无',
    `进度：${completed}/${total} 个任务`,
  ];
  if (missing.length > 0) {
    lines.push(`缺失文件（${missing.length}）：${missing.join(', ')}`);
  } else {
    lines.push('缺失文件：无');
  }
  if (todoSummary) {
    lines.push(todoSummary);
  }

  // 5-Question Reboot Test 输出（Planning-with-Files P0-2）
  if (fiveQuestions) {
    lines.push('');
    lines.push('=== 5-Question Reboot Test ===');
    const questions = [
      ['Q1: Feature与阶段', fiveQuestions.featureAndStage],
      ['Q2: 当前TASK', fiveQuestions.currentTask],
      ['Q3: 最后结论', fiveQuestions.lastConclusion],
      ['Q4: 当前阻塞', fiveQuestions.currentBlocker],
      ['Q5: 下一步命令', fiveQuestions.nextAction],
    ] as const;
    for (const [label, q] of questions) {
      const gapMark = q.gap ? ' [GAP]' : '';
      lines.push(`${label}: ${q.answer}${gapMark}`);
    }
  }

  return lines.join('\n');
}

/** 提取 5-Question Reboot Test 答案（Planning-with-Files P0-2） */
function extractFiveQuestions(
  featureId: string,
  phase: string,
  task: string | undefined,
  findingsContent: string,
  missingFiles: string[],
): FiveQuestions {
  // Q1: Feature 与阶段
  const featureAndStage = {
    answer: `${featureId} @ ${phase}`,
    gap: phase === 'unknown' || missingFiles.includes('stage-state.json'),
  };

  // Q2: 当前 TASK
  const currentTaskAnswer = task ?? '无 in_progress 任务';
  const currentTaskQ = {
    answer: currentTaskAnswer,
    gap: !task,
  };

  // Q3: 最后结论（从 findings.md 提取最后非空行）
  let lastConclusion = '未找到';
  let lastConclusionGap = true;
  if (findingsContent) {
    const nonEmptyLines = findingsContent.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (nonEmptyLines.length > 0) {
      lastConclusion = nonEmptyLines[nonEmptyLines.length - 1].trim().slice(0, 100);
      lastConclusionGap = false;
    }
  }
  const lastConclusionQ = { answer: lastConclusion, gap: lastConclusionGap };

  // Q4: 当前阻塞（从 findings.md 提取阻塞标记，或根据 missingFiles 判断）
  let blocker = '无明确阻塞';
  let blockerGap = false;
  if (missingFiles.length > 0) {
    blocker = `缺失文件: ${missingFiles.slice(0, 3).join(', ')}${missingFiles.length > 3 ? '...' : ''}`;
    blockerGap = true;
  } else if (findingsContent) {
    const blockerMatch = findingsContent.match(/\[BLOCKED\]|\[阻塞\]|阻塞[:：]\s*(.+)/i);
    if (blockerMatch) {
      blocker = blockerMatch[1] ?? blockerMatch[0];
      blockerGap = true;
    }
  }
  const currentBlockerQ = { answer: blocker, gap: blockerGap };

  // Q5: 下一步命令（必须给出有效可执行命令）
  let nextAction = `执行 spec-first stage current ${featureId} 确认当前阶段`;
  let nextActionGap = true;
  if (task) {
    nextAction = `执行 /spec-first:code --task ${task}`;
    nextActionGap = false;
  } else if (phase === '01_specify') {
    nextAction = '执行 /spec-first:spec';
    nextActionGap = false;
  } else if (phase === '02_design') {
    nextAction = '执行 /spec-first:design';
    nextActionGap = false;
  } else if (phase === '03_plan') {
    nextAction = '执行 /spec-first:task';
    nextActionGap = false;
  } else if (phase === '04_implement') {
    nextAction = '执行 /spec-first:code';
    nextActionGap = false;
  } else if (phase === '05_verify') {
    nextAction = '执行 /spec-first:test';
    nextActionGap = false;
  } else if (phase === '06_wrap_up') {
    nextAction = '执行 /spec-first:archive';
    nextActionGap = false;
  }
  const nextActionQ = { answer: nextAction, gap: nextActionGap };

  return {
    featureAndStage,
    currentTask: currentTaskQ,
    lastConclusion: lastConclusionQ,
    currentBlocker: currentBlockerQ,
    nextAction: nextActionQ,
  };
}
