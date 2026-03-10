/**
 * Session Catchup — 6步恢复流程
 * 读取 stage-state → task_plan → findings → 定位 → 扫描缺失 → 输出摘要
 * Planning-with-Files P0-2: 5-Question Reboot Test 结构化输出
 */
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';
import { readJson, exists, readMarkdown } from '../../shared/fs-utils.js';
import { loadTodoState, summarizeTodoState } from './todo-runner.js';
import { readTaskPlan } from '../task-plan/parser.js';
import { loadConfig } from '../../shared/config-schema.js';
import { buildTaskContextPack } from './context-pack.js';
import { buildCatchupSummary, extractFiveQuestions } from './catchup-summary.js';
import type { FiveQuestions } from './catchup-summary.js';
export type { FiveQuestions } from './catchup-summary.js';

/** auto-loop 运行时摘要（ORCH-008） */
export interface AutoLoopSummary {
  currentTaskId: string | null;
  heartbeatAt: string | null;
  retryBudgetRemaining: number;
}

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
  /** 背景输入状态（由 init 写入 stage-state.json） */
  backgroundInputStatus?: 'full' | 'degraded' | 'blind';
  /** 5-Question Reboot Test 结果（Planning-with-Files P0-2） */
  fiveQuestions: FiveQuestions;
  /** auto-loop 运行时摘要（ORCH-008），运行中时非空 */
  autoLoopSummary?: AutoLoopSummary;
  /** Step 级恢复状态（TASK-SPECOPT-015） */
  stepRecovery?: {
    currentStep: string;
    completedSteps: string[];
    skippedSteps: string[];
    nextStep: string;
    complexity: string;
    scenario: string;
  };
  /** 是否因节流而跳过（I5: 区分真实结果与伪造数据） */
  skipped: boolean;
  summary: string;
}

/** 自动触发策略 */
export type TriggerStrategy = 'auto' | 'prompt' | 'off';

/** 并发保护：60秒内不重复触发 */
const catchupLocks = new Map<string, number>();
const LOCK_TTL = 60_000;

/** 执行 6 步恢复流程 */
export function catchup(featureId: string, projectRoot: string): CatchupResult {
  const now = Date.now();

  // I5: 清理过期锁，防止 Map 无界增长
  for (const [fid, timestamp] of catchupLocks.entries()) {
    if (now - timestamp >= LOCK_TTL) {
      catchupLocks.delete(fid);
    }
  }

  // 并发保护
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
      skipped: true,  // I5: 标记为节流跳过
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
  const parsedTaskPlan = readTaskPlan(projectRoot, featureId);
  if (parsedTaskPlan) {
    totalTasks = parsedTaskPlan.stats.total;
    completedTasks = parsedTaskPlan.stats.completed;
  } else if (!exists(taskPlanPath)) {
    missingFiles.push('task_plan.md');
  }

  // Step 3: Read findings.md
  const findingsPath = join(specDir, 'findings.md');
  let findingsContent = '';
  let stepRecovery: CatchupResult['stepRecovery'];
  if (!exists(findingsPath)) {
    missingFiles.push('findings.md');
  } else {
    findingsContent = readMarkdown(findingsPath);
    // 解析 Step 级状态头（TASK-SPECOPT-015）
    const yamlMatch = findingsContent.match(/^---\n([\s\S]*?)\n---/);
    if (yamlMatch && currentPhase === '01_specify') {
      const yaml = yamlMatch[1];
      const currentStepMatch = yaml.match(/current_step:\s*"([^"]*)"/);
      const completedMatch = yaml.match(/completed_steps:\s*\[(.*?)\]/);
      const skippedMatch = yaml.match(/skipped_steps:\s*\[(.*?)\]/);
      const nextStepMatch = yaml.match(/next_step:\s*"([^"]*)"/);
      const complexityMatch = yaml.match(/complexity:\s*"([^"]*)"/);
      const scenarioMatch = yaml.match(/scenario:\s*"([^"]*)"/);

      if (currentStepMatch) {
        stepRecovery = {
          currentStep: currentStepMatch[1],
          completedSteps: completedMatch ? completedMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean) : [],
          skippedSteps: skippedMatch ? skippedMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean) : [],
          nextStep: nextStepMatch?.[1] ?? '',
          complexity: complexityMatch?.[1] ?? '待判定',
          scenario: scenarioMatch?.[1] ?? '待判定',
        };
      }
    }
  }

  // Step 4: Locate current task
  const currentTask = parsedTaskPlan?.currentTaskId;

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

  // Step 5.6: auto-loop runtime 摘要（ORCH-008）
  let autoLoopSummary: AutoLoopSummary | undefined;
  const autoLoop = todoState?.runtime?.autoLoop;
  if (autoLoop) {
    const aoConfig = loadConfig(projectRoot).runtime.auto_orchestrate;
    autoLoopSummary = {
      currentTaskId: autoLoop.currentTaskId,
      heartbeatAt: autoLoop.heartbeatAt,
      retryBudgetRemaining: Math.max(0,
        aoConfig.max_total_retry_duration_ms - (autoLoop.retry?.totalRetryDurationMs ?? 0)),
    };
  }

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
    state?.backgroundInputStatus,
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
    backgroundInputStatus: state?.backgroundInputStatus,
    fiveQuestions,
    autoLoopSummary,
    stepRecovery,
    skipped: false,  // I5: 正常执行，非节流跳过
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
