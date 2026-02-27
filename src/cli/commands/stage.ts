/**
 * stage CLI 命令组
 * spec-first stage current|advance|cancel
 */
import { ExitCode } from '../../shared/types.js';
import { advance, GateUnavailableError, GateFailedError } from '../../core/process-engine/advance.js';
import { cancel } from '../../core/process-engine/advance.js';
import { getFeatureState } from '../../core/process-engine/feature.js';
import { parseFlag } from '../parse-utils.js';

export function handleStage(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'current': return handleCurrent(rest);
    case 'advance': return handleAdvance(rest);
    case 'cancel':  return handleCancel(rest);
    default:
      console.error(`未知 stage 子命令：${sub}`);
      printStageHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleCurrent(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first stage current <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const state = getFeatureState(featureId, process.cwd());
    console.log(`Feature：${state.featureId}`);
    console.log(`阶段：   ${state.currentStage}`);
    console.log(`模式：   ${state.mode}  规模：${state.size}`);
    console.log(`终态：${state.terminal}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleAdvance(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first stage advance <featureId> [--force]');
    return ExitCode.VALIDATION_ERROR;
  }

  const force = args.includes('--force');

  try {
    const result = advance(featureId, process.cwd(), { force });
    console.log(`已推进：${result.from} → ${result.to}`);
    console.log(`Gate：${result.gateResult}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    if (e instanceof GateFailedError) {
      console.error(`Gate 阻断：${e.message}`);
      return ExitCode.GATE_FAILED;
    }
    if (e instanceof GateUnavailableError) {
      console.error(`Gate 阻断：${e.message}`);
      return ExitCode.GATE_FAILED;
    }
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleCancel(args: string[]): number {
  const featureId = args[0];
  const reason = parseFlag(args, '--reason');

  if (!featureId || !reason) {
    console.error('用法：spec-first stage cancel <featureId> --reason "<reason>"');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = cancel(featureId, process.cwd(), reason);
    console.log(`已取消：${result.from} → ${result.to}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function printStageHelp(): void {
  console.log(`用法：spec-first stage <subcommand>

子命令：
  current   查看当前阶段
  advance   推进到下一阶段
  cancel    取消 Feature`);
}
