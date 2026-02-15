/**
 * stage CLI 命令组
 * spec-first stage current|advance|cancel
 */
import { ExitCode } from '../../shared/types.js';
import { advance, GateUnavailableError, GateFailedError } from '../../core/process-engine/advance.js';
import { cancel } from '../../core/process-engine/advance.js';
import { getFeatureState } from '../../core/process-engine/feature.js';

export function handleStage(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'current': return handleCurrent(rest);
    case 'advance': return handleAdvance(rest);
    case 'cancel':  return handleCancel(rest);
    default:
      console.error(`Unknown stage subcommand: ${sub}`);
      printStageHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleCurrent(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first stage current <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const state = getFeatureState(featureId, process.cwd());
    console.log(`Feature: ${state.featureId}`);
    console.log(`Stage:   ${state.currentStage}`);
    console.log(`Mode:    ${state.mode}  Size: ${state.size}`);
    console.log(`Terminal: ${state.terminal}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleAdvance(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first stage advance <featureId> [--force]');
    return ExitCode.VALIDATION_ERROR;
  }

  const force = args.includes('--force');

  try {
    const result = advance(featureId, process.cwd(), { force });
    console.log(`Advanced: ${result.from} → ${result.to}`);
    console.log(`Gate: ${result.gateResult}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    if (e instanceof GateFailedError) {
      console.error(`Gate blocked: ${e.message}`);
      return ExitCode.GATE_FAILED;
    }
    if (e instanceof GateUnavailableError) {
      console.error(`Gate blocked: ${e.message}`);
      return ExitCode.GATE_FAILED;
    }
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleCancel(args: string[]): number {
  const featureId = args[0];
  const reason = parseFlag(args, '--reason');

  if (!featureId || !reason) {
    console.error('Usage: spec-first stage cancel <featureId> --reason "<reason>"');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = cancel(featureId, process.cwd(), reason);
    console.log(`Cancelled: ${result.from} → ${result.to}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function printStageHelp(): void {
  console.log(`Usage: spec-first stage <subcommand>

Subcommands:
  current   Show current stage
  advance   Advance to next stage
  cancel    Cancel feature`);
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
