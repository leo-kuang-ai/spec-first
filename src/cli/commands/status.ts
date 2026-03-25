import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ExitCode,
  Stage,
  type BackgroundInputStatus,
  type FeatureState,
  type NodeStatus,
} from '../../shared/types.js';
import { exists, readJson } from '../../shared/fs-utils.js';
import { currentFeature, resolveFeatureId } from '../../core/process-engine/feature.js';
import { readTaskPlan } from '../../core/task-plan/parser.js';
import { checkFirstDocsExistence } from '../../core/skill-runtime/first-docs-check.js';
import { readFirstRuntimeIndex } from '../../core/skill-runtime/first-runtime-store.js';
import { checkReadiness } from '../../core/process-engine/readiness-check.js';
import { getNextStages } from '../../core/process-engine/stage-machine.js';

type CanonicalTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

interface BackgroundLayers {
  backgroundInputStatus: BackgroundInputStatus | 'missing';
  runtimeTruth: 'current' | 'stale' | 'missing';
  docsOutputs: 'ready' | 'missing';
  syncStatus: 'ready' | 'attention' | 'unknown';
}

export function handleStatus(args: string[]): number {
  const projectRoot = process.cwd();
  const featureId = resolveTargetFeatureId(args[0], projectRoot);

  if (!featureId) {
    console.error('未找到当前 Feature。请先执行：spec-first feature switch <featureId> --yes');
    return ExitCode.VALIDATION_ERROR;
  }

  const stageStatePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(stageStatePath)) {
    console.error(`未找到 stage-state.json：${stageStatePath}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const state = readJson<FeatureState>(stageStatePath);
  const taskPlan = readTaskPlan(projectRoot, featureId);
  const taskCounts = summarizeTaskCounts(taskPlan);
  const currentNode = state.nodes?.[state.currentStage];
  const background = readBackgroundLayers(projectRoot, state);
  const nextStage = getNextStages(state.currentStage).find((stage) => stage !== Stage.CANCELLED);
  const readiness = nextStage
    ? checkReadiness({
        currentStage: state.currentStage,
        targetStage: nextStage,
        nodes: state.nodes,
        artifacts: collectArtifacts(projectRoot, featureId),
        terminal: state.terminal,
      })
    : undefined;
  const suggestedCommand = resolveSuggestedCommand(featureId, state, currentNode?.status, readiness);

  console.log(`# Feature Status Dashboard\n`);
  console.log(`Feature ID: ${state.featureId}`);
  console.log(`标题: ${state.title ?? 'N/A'}`);
  console.log(`当前阶段: ${state.currentStage}`);
  console.log(`节点状态: ${currentNode?.status ?? 'unknown'}`);
  console.log(`节点摘要: ${currentNode?.summary ?? 'N/A'}`);
  console.log(`模式: ${state.mode ?? 'N/A'}`);
  console.log(`规模: ${state.size ?? 'N/A'}`);
  console.log(`平台: ${state.platforms?.join(', ') ?? 'N/A'}`);
  console.log('');
  console.log(`background_input_status: ${background.backgroundInputStatus}`);
  console.log(`runtime 真源: ${background.runtimeTruth}`);
  console.log(`docs 输出: ${background.docsOutputs}`);
  console.log(`同步状态: ${background.syncStatus}`);
  console.log('');
  console.log('文档指标: 已退场（不再依赖 document-links.yaml）');
  console.log('');
  console.log('任务进度（canonical 状态）:');
  console.log(`  done: ${taskCounts.done}`);
  console.log(`  in_progress: ${taskCounts.in_progress}`);
  console.log(`  todo: ${taskCounts.todo}`);
  console.log(`  blocked: ${taskCounts.blocked}`);
  console.log('');

  if (currentNode?.status === 'blocked') {
    console.log('恢复建议:');
    console.log('  1. 先解决节点级阻塞原因');
    console.log('  2. 如存在任务级 blocked，请先更新 task_plan.md 对应行');
    console.log('  3. 通过 orchestrate/transition 将节点恢复到 in_progress');
    console.log('');
  }

  if (background.syncStatus !== 'ready') {
    console.log('风险:');
    if (background.runtimeTruth !== 'current') console.log('  [medium] runtime 真源异常');
    if (background.docsOutputs === 'missing') console.log('  [medium] docs 输出缺失');
    if (background.syncStatus === 'attention') console.log('  [medium] 同步状态异常');
    console.log('');
  }

  console.log(`建议下一步: ${suggestedCommand ?? '无'}`);
  if (readiness) {
    const reasons = summarizeReadinessReasons(readiness);
    if (reasons.length > 0) {
      console.log(`原因: ${reasons.join('；')}`);
    }
  }

  return ExitCode.SUCCESS;
}

function resolveTargetFeatureId(requested: string | undefined, projectRoot: string): string | undefined {
  if (requested?.trim()) return resolveFeatureId(requested, projectRoot).featureId;
  const current = currentFeature(projectRoot);
  if (current) return current;
  try {
    return resolveFeatureId(undefined, projectRoot).featureId;
  } catch {
    return undefined;
  }
}

function summarizeTaskCounts(
  plan: ReturnType<typeof readTaskPlan>
): Record<CanonicalTaskStatus, number> {
  const counts = { todo: 0, in_progress: 0, blocked: 0, done: 0 };
  if (!plan) return counts;

  for (const task of plan.tasks) {
    if (task.status === 'done') counts.done += 1;
    else if (task.status === 'in_progress') counts.in_progress += 1;
    else if (task.status === 'blocked') counts.blocked += 1;
    else counts.todo += 1;
  }

  return counts;
}

function readBackgroundLayers(projectRoot: string, state: FeatureState): BackgroundLayers {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  if (!runtimeIndex) {
    return {
      backgroundInputStatus: state.backgroundInputStatus ?? 'missing',
      runtimeTruth: 'missing',
      docsOutputs: 'missing',
      syncStatus: 'unknown',
    };
  }

  const docsReady = checkFirstDocsExistence(projectRoot).ok;
  const runtimeTruth = runtimeIndex.status === 'current' ? 'current' : 'stale';
  const docsOutputs = docsReady ? 'ready' : 'missing';

  return {
    backgroundInputStatus: state.backgroundInputStatus ?? 'missing',
    runtimeTruth,
    docsOutputs,
    syncStatus: runtimeTruth === 'current' && docsReady ? 'ready' : 'attention',
  };
}

function collectArtifacts(projectRoot: string, featureId: string): string[] {
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!exists(featureDir)) return [];
  return readdirSync(featureDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

function resolveSuggestedCommand(
  featureId: string,
  state: FeatureState,
  currentStatus: NodeStatus | undefined,
  readiness?: ReturnType<typeof checkReadiness>
): string | undefined {
  if (currentStatus === 'blocked') return '/spec-first:orchestrate';
  if (!readiness) return undefined;
  if (readiness.decision === 'READY_TO_ADVANCE') {
    return `spec-first transition ${featureId}`;
  }
  if (readiness.decision === 'BLOCKED') {
    return '/spec-first:orchestrate';
  }
  return fallbackSuggestedCommand(state.currentStage);
}

function summarizeReadinessReasons(readiness: ReturnType<typeof checkReadiness>): string[] {
  const reasons: string[] = [];
  if (!readiness.checks.previousNodeComplete) reasons.push('当前节点未完成');
  if (!readiness.checks.requiredArtifactsExist) reasons.push('目标节点所需产物未齐全');
  if (!readiness.checks.noActiveWork) reasons.push('存在其他活跃节点工作');
  if (!readiness.checks.notTerminal) reasons.push('Feature 已处于终态');
  return reasons;
}

function fallbackSuggestedCommand(currentStage: FeatureState['currentStage']): string | undefined {
  switch (currentStage) {
    case '00_init':
      return '/spec-first:init';
    case '01_specify':
      return '/spec-first:spec-review';
    case '02_design':
      return '/spec-first:task';
    case '03_plan':
    case '04_implement':
      return '/spec-first:code';
    case '05_verify':
      return '/spec-first:verify';
    case '06_wrap_up':
      return '/spec-first:archive';
    default:
      return undefined;
  }
}
