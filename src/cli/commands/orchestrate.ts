import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode, Stage, type FeatureState } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import {
  currentFeature,
  getFeatureState,
  resolveFeatureId,
} from '../../core/process-engine/feature.js';
import {
  validateOrchestrateArgs,
  OrchestrateArgsError,
} from '../../core/skill-runtime/orchestrate-args.js';
import { runAutoLoop } from '../../core/ai-orchestrator/auto-loop.js';
import type {
  TaskExecutor,
  AutoLoopResult,
  AutoLoopStatus,
} from '../../core/ai-orchestrator/auto-loop.js';
import { advance } from '../../core/process-engine/advance.js';
import { checkReadiness } from '../../core/process-engine/readiness-check.js';
import { getNextStages } from '../../core/process-engine/stage-machine.js';
import { loadConfig, resetConfigCache } from '../../shared/config-schema.js';

const AUTO_LOOP_STATUS_MESSAGES: Record<AutoLoopStatus, string> = {
  all_done: '✅ 所有任务完成',
  has_blocked: '❌ 存在阻塞任务',
  timeout: '⏱️ 任务执行超时',
  no_state_file: '📄 状态文件缺失',
  max_iterations: '🔄 达到最大迭代次数',
  incomplete: '⚠️ 任务未完成',
};

export interface OrchestrateCommandOptions {
  executor?: TaskExecutor;
  runLoop?: typeof runAutoLoop;
}

function pickFeatureToken(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith('--'));
}

function resolveFeatureOrCurrent(requested: string | undefined, projectRoot: string): string {
  if (requested) {
    return resolveFeatureId(requested, projectRoot).featureId;
  }
  const current = currentFeature(projectRoot);
  if (!current) {
    throw new Error('未提供 featureId，且 .spec-first/current 不存在');
  }
  return resolveFeatureId(current, projectRoot).featureId;
}

function getForwardStage(currentStage: Stage): Stage | undefined {
  return getNextStages(currentStage).find((stage) => stage !== Stage.CANCELLED);
}

function collectArtifacts(projectRoot: string, featureId: string): string[] {
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!exists(featureDir)) return [];
  return readdirSync(featureDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

function printDecision(
  featureId: string,
  state: FeatureState,
  result: ReturnType<typeof checkReadiness>
): void {
  console.log(`Feature：${featureId}`);
  console.log(`当前阶段：${state.currentStage}`);
  console.log(`目标阶段：${result.targetStage}`);
  console.log(`决策：${result.decision}`);
  if (result.checks.warnings.length > 0) {
    console.log('警告：');
    for (const warning of result.checks.warnings) {
      console.log(`  - ${warning}`);
    }
  }
}

export async function handleOrchestrate(
  args: string[],
  options: OrchestrateCommandOptions = {}
): Promise<number> {
  try {
    const projectRoot = process.cwd();
    resetConfigCache();
    const cfg = loadConfig(projectRoot);
    const orchestrateArgs = validateOrchestrateArgs(args);
    const featureId = resolveFeatureOrCurrent(pickFeatureToken(args), projectRoot);

    const isAutoMode = orchestrateArgs.mode === 'auto' || cfg.runtime.auto_orchestrate.enabled;

    let autoLoopResult: AutoLoopResult | undefined;
    if (isAutoMode && options.executor) {
      autoLoopResult = await (options.runLoop ?? runAutoLoop)({
        featureId,
        projectRoot,
        args: orchestrateArgs,
        executor: options.executor,
        onIteration: () => undefined,
      });
      console.log(`auto-loop: ${AUTO_LOOP_STATUS_MESSAGES[autoLoopResult.status]}`);
      if (autoLoopResult.haltReason) {
        console.log(`halt_reason: ${autoLoopResult.haltReason}`);
      }
    }

    const state = getFeatureState(featureId, projectRoot);
    const nextStage = getForwardStage(state.currentStage);
    if (!nextStage) {
      console.log(`Feature：${featureId}`);
      console.log(`当前阶段：${state.currentStage}`);
      console.log(`决策：BLOCKED`);
      return ExitCode.SUCCESS;
    }

    const readiness = checkReadiness({
      currentStage: state.currentStage,
      targetStage: nextStage,
      nodes: state.nodes,
      artifacts: collectArtifacts(projectRoot, featureId),
      terminal: state.terminal,
    });

    printDecision(featureId, state, readiness);

    if (
      orchestrateArgs.autoAdvance === true &&
      readiness.decision === 'READY_TO_ADVANCE' &&
      (!autoLoopResult || autoLoopResult.status === 'all_done')
    ) {
      const advanceResult = advance(featureId, projectRoot);
      console.log(`已推进：${advanceResult.from} → ${advanceResult.to}`);
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof OrchestrateArgsError) {
      console.error(error.message);
      return ExitCode.VALIDATION_ERROR;
    }
    console.error(`错误：${(error as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}
