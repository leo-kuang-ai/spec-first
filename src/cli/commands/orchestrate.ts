import { ExitCode } from '../../shared/types.js';
import {
  currentFeature,
  getFeatureState,
  resolveFeatureId,
} from '../../core/process-engine/feature.js';
import {
  validateOrchestrateArgs,
  OrchestrateArgsError,
} from '../../core/skill-runtime/orchestrate-args.js';
import { loadTodoState } from '../../core/ai-orchestrator/todo-runner.js';
import { runAutoLoop } from '../../core/ai-orchestrator/auto-loop.js';
import type {
  TaskExecutor,
  AutoLoopResult,
  AutoLoopStatus,
} from '../../core/ai-orchestrator/auto-loop.js';
import { evaluateGate } from '../../core/gate-engine/gate-evaluator.js';
import { checkDependencies } from '../../core/process-engine/dependency-checker.js';
import {
  advance,
  GateFailedError,
  GateUnavailableError,
} from '../../core/process-engine/advance.js';
import { decideNextStep, getNextStage } from '../../core/process-engine/next-step-decider.js';
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

function printDecision(
  featureId: string,
  currentStage: string,
  stageStatus: string | undefined,
  result: ReturnType<typeof decideNextStep>
): void {
  console.log(`Feature：${featureId}`);
  console.log(`当前阶段：${currentStage}`);
  console.log(`阶段子状态：${stageStatus ?? 'drafting'}`);
  if (result.nextStage) {
    console.log(`下一阶段：${result.nextStage}`);
  }
  console.log(`决策：${result.decision}`);
  if (result.suggestedCommand) {
    console.log(`建议命令：${result.suggestedCommand}`);
  }
  if (result.reasons.length > 0) {
    console.log('阻塞原因：');
    for (const reason of result.reasons) {
      console.log(`  - ${reason}`);
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

    // enabled 配置联动：--auto 标志 OR config enabled=true → auto 模式
    const isAutoMode = orchestrateArgs.mode === 'auto' || cfg.runtime.auto_orchestrate.enabled;

    let autoLoopResult: AutoLoopResult | undefined;
    if (isAutoMode && options.executor) {
      autoLoopResult = await (options.runLoop ?? runAutoLoop)({
        featureId,
        projectRoot,
        args: orchestrateArgs,
        executor: options.executor,
        onIteration: (iteration, state) => {
          const done = state.items.filter((i) => i.status === 'done').length;
          const total = state.items.length;
          console.log(`  [auto-loop] 迭代 ${iteration}: ${done}/${total} 任务完成`);
        },
      });
      console.log(`auto-loop: ${AUTO_LOOP_STATUS_MESSAGES[autoLoopResult.status]}`);
      if (autoLoopResult.haltReason) {
        console.log(`halt_reason: ${autoLoopResult.haltReason}`);
      }
    }

    const state = getFeatureState(featureId, projectRoot);
    const upcomingStage = getNextStage(state.currentStage);
    const decision = decideNextStep({
      featureId,
      currentStage: state.currentStage,
      stageStatus: state.stageStatus,
      autoAdvancePolicy: state.autoAdvancePolicy,
      gateStatus:
        state.stageStatus === 'ready_to_advance'
          ? evaluateGate(featureId, projectRoot, { persist: false }).status
          : undefined,
      dependencyCheck: upcomingStage
        ? checkDependencies(
            featureId,
            upcomingStage,
            projectRoot,
            state.mergedRules?.profile ?? 'default-simplified'
          )
        : undefined,
      todoState: loadTodoState(featureId, projectRoot),
      autoLoopStatus: autoLoopResult?.status,
    });

    printDecision(featureId, state.currentStage, state.stageStatus, decision);

    if (
      orchestrateArgs.autoAdvance === true &&
      (decision.decision === 'READY_TO_ADVANCE' || decision.decision === 'AUTO_ADVANCE') &&
      (!autoLoopResult || autoLoopResult.status === 'all_done')
    ) {
      const advanceResult = advance(featureId, projectRoot);
      console.log(`已推进：${advanceResult.from} → ${advanceResult.to}`);
      console.log(`Gate：${advanceResult.gateResult}`);
    }

    return ExitCode.SUCCESS;
  } catch (error) {
    if (error instanceof OrchestrateArgsError) {
      console.error(error.message);
      return ExitCode.VALIDATION_ERROR;
    }
    if (error instanceof GateFailedError || error instanceof GateUnavailableError) {
      console.error(`Gate 阻断：${error.message}`);
      return ExitCode.GATE_FAILED;
    }
    console.error(`错误：${(error as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}
