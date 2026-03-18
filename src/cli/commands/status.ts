import { join } from 'node:path';
import { ExitCode, type BackgroundInputStatus, type StageState } from '../../shared/types.js';
import { exists, readJson } from '../../shared/fs-utils.js';
import { currentFeature, resolveFeatureId } from '../../core/process-engine/feature.js';
import { getCoverage } from '../../core/trace-engine/coverage.js';
import { calcHealthScore } from '../../core/metrics-engine/health-score.js';
import { detectBottlenecks } from '../../core/metrics-engine/bottleneck.js';
import { parseMatrix } from '../../core/trace-engine/matrix.js';
import { createTraceContext } from '../../core/trace-engine/trace-context.js';
import { readTaskPlan } from '../../core/task-plan/parser.js';
import { readFirstRuntimeIndex } from '../../core/skill-runtime/first-runtime-store.js';
import { decideNextStep } from '../../core/process-engine/next-step-decider.js';

type CanonicalTaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

interface BackgroundLayers {
  backgroundInputStatus: BackgroundInputStatus | 'missing';
  runtimeTruth: 'current' | 'stale' | 'missing';
  docsProjection: 'healthy' | 'drifted' | 'missing';
  syncStatus: 'in_sync' | 'drifted' | 'unknown';
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

  const state = readJson<StageState>(stageStatePath);
  const coverage = getCoverage(featureId, projectRoot);
  const health = calcHealthScore(coverage, 0, 0);
  const taskPlan = readTaskPlan(projectRoot, featureId);
  const taskCounts = summarizeTaskCounts(taskPlan);
  const background = readBackgroundLayers(projectRoot, state);
  const c1 = calcDesignCoverage(featureId, projectRoot);
  const bottlenecks = detectBottlenecks(coverage);
  const decision = decideNextStep({
    featureId,
    currentStage: state.currentStage,
    stageStatus: state.stageStatus,
    autoAdvancePolicy: state.autoAdvancePolicy,
    todoState: taskPlan
      ? {
          halted: taskCounts.blocked > 0,
          haltReason: taskCounts.blocked > 0 ? 'blocked' : undefined,
          items: taskPlan.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            status:
              task.status === 'complete'
                ? 'done'
                : task.status === 'blocked'
                  ? 'blocked'
                  : task.status === 'in_progress'
                    ? 'in_progress'
                    : 'pending',
          })),
        }
      : undefined,
  });
  const suggestedCommand = decision.suggestedCommand ?? fallbackSuggestedCommand(state.currentStage);

  console.log(`# Feature Status Dashboard\n`);
  console.log(`Feature ID: ${state.featureId}`);
  console.log(`标题: ${state.title ?? 'N/A'}`);
  console.log(`当前阶段: ${state.currentStage}`);
  console.log(`阶段状态: ${state.stageStatus ?? 'drafting'}`);
  console.log(`模式: ${state.mode}`);
  console.log(`规模: ${state.size}`);
  console.log(`平台: ${state.platforms.join(', ')}`);
  console.log('');
  console.log(`background_input_status: ${background.backgroundInputStatus}`);
  console.log(`runtime 真源: ${background.runtimeTruth}`);
  console.log(`docs 投影视图: ${background.docsProjection}`);
  console.log(`同步状态: ${background.syncStatus}`);
  console.log('');
  console.log('覆盖率指标:');
  console.log(`  C1 (Design Coverage): ${formatPct(c1)}`);
  console.log(`  C3 (Task Coverage): ${formatPct(coverage.C3)}`);
  console.log(`  C4 (Test Coverage FR): ${formatPct(coverage.C4)}`);
  console.log(`  C6 (Implementation Coverage): ${formatPct(coverage.C6)}`);
  console.log(`  C8 (Task Compliance): ${formatPct(coverage.C8)}`);
  console.log(`  C9 (TC Compliance): ${formatPct(coverage.C9)}`);
  console.log('');
  console.log(`健康分: ${health.H1} (${health.grade})`);
  console.log('');
  console.log('任务进度（canonical 状态）:');
  console.log(`  done: ${taskCounts.done}`);
  console.log(`  in_progress: ${taskCounts.in_progress}`);
  console.log(`  todo: ${taskCounts.todo}`);
  console.log(`  blocked: ${taskCounts.blocked}`);
  console.log('');

  if (bottlenecks.length > 0 || background.syncStatus !== 'in_sync') {
    console.log('风险:');
    for (const bottleneck of bottlenecks) {
      console.log(`  [${bottleneck.severity}] ${bottleneck.rule}: ${bottleneck.description}`);
    }
    if (background.runtimeTruth !== 'current') {
      console.log('  [medium] runtime 真源异常');
    }
    if (background.docsProjection === 'drifted') {
      console.log('  [medium] docs 投影视图漂移');
    }
    if (background.syncStatus === 'drifted') {
      console.log('  [medium] 同步状态异常');
    }
    console.log('');
  }

  console.log(`建议下一步: ${suggestedCommand ?? '无'}`);
  if (decision.reasons.length > 0) {
    console.log(`原因: ${decision.reasons.join('；')}`);
  }

  return ExitCode.SUCCESS;
}

function resolveTargetFeatureId(requested: string | undefined, projectRoot: string): string | undefined {
  if (requested?.trim()) {
    return resolveFeatureId(requested, projectRoot).featureId;
  }

  const current = currentFeature(projectRoot);
  if (current) return current;

  try {
    return resolveFeatureId(undefined, projectRoot).featureId;
  } catch {
    return undefined;
  }
}

function calcDesignCoverage(featureId: string, projectRoot: string): number {
  const rows = parseMatrix(featureId, projectRoot);
  const trace = createTraceContext(rows);
  if (trace.frRows.length === 0) return 1;

  const covered = trace.frRows.filter((fr) =>
    trace.dsRows.some((ds) => (ds.upstream ?? []).includes(fr.id))
  ).length;

  return covered / trace.frRows.length;
}

function summarizeTaskCounts(
  plan: ReturnType<typeof readTaskPlan>
): Record<CanonicalTaskStatus, number> {
  const counts = {
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  };

  if (!plan) return counts;

  for (const task of plan.tasks) {
    if (task.status === 'complete') {
      counts.done += 1;
    } else if (task.status === 'in_progress') {
      counts.in_progress += 1;
    } else if (task.status === 'blocked') {
      counts.blocked += 1;
    } else {
      counts.todo += 1;
    }
  }

  return counts;
}

function readBackgroundLayers(projectRoot: string, state: StageState): BackgroundLayers {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  if (!runtimeIndex) {
    return {
      backgroundInputStatus: state.backgroundInputStatus ?? 'missing',
      runtimeTruth: 'missing',
      docsProjection: 'missing',
      syncStatus: 'unknown',
    };
  }

  const docsHealthy = Object.values(runtimeIndex.docsProjection).every((entry) => entry.healthy);
  const runtimeTruth = runtimeIndex.status === 'current' ? 'current' : 'stale';
  const docsProjection = docsHealthy ? 'healthy' : 'drifted';

  return {
    backgroundInputStatus: state.backgroundInputStatus ?? 'missing',
    runtimeTruth,
    docsProjection,
    syncStatus: runtimeTruth === 'current' && docsHealthy ? 'in_sync' : 'drifted',
  };
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function fallbackSuggestedCommand(currentStage: StageState['currentStage']): string | undefined {
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
