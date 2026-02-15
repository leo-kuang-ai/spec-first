/**
 * Gate CLI 命令组
 * gate check / gate history / gate conditions / golive check
 */
import { ExitCode } from '../../shared/types.js';
import { evaluateGate, getConditions, getGateHistory } from '../../core/gate-engine/gate-evaluator.js';
import { checkGoLive } from '../../core/gate-engine/golive.js';
import { readJson, exists } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import type { StageState, Stage } from '../../shared/types.js';

export function handleGate(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'check': return handleCheck(args.slice(1));
    case 'history': return handleHistory(args.slice(1));
    case 'conditions': return handleConditions(args.slice(1));
    default:
      printGateHelp();
      if (sub) console.error(`Unknown gate subcommand: ${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

export function handleGoLive(args: string[]): number {
  const sub = args[0];
  if (sub !== 'check') {
    console.log('Usage: spec-first golive check [featureId]');
    return ExitCode.VALIDATION_ERROR;
  }
  return handleGoLiveCheck(args.slice(1));
}

// ─── Subcommand Handlers ─────────────────────────────────

function handleCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first gate check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = evaluateGate(featureId, cwd);
    console.log(`Gate Check — ${featureId} (${result.stage})\n`);
    console.log(`Result: ${result.status}\n`);

    for (const c of result.conditions) {
      const icon = c.status === 'PASS' ? '[OK]' : c.status === 'WAIVER' ? '[WVR]' : '[FAIL]';
      console.log(`  ${icon.padEnd(7)} ${c.description}`);
      if (c.detail) console.log(`          ${c.detail}`);
    }

    if (result.suggestions && result.suggestions.length > 0) {
      console.log('\nSuggestions:');
      for (const s of result.suggestions) console.log(`  - ${s}`);
    }

    return result.status === 'FAIL' ? ExitCode.VALIDATION_ERROR : ExitCode.SUCCESS;
  } catch {
    console.error(`Failed to evaluate gate for ${featureId}`);
    return ExitCode.IO_ERROR;
  }
}

function handleHistory(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first gate history <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const history = getGateHistory(featureId, process.cwd());
  if (history.length === 0) {
    console.log('No gate history found.');
    return ExitCode.SUCCESS;
  }

  console.log(`Gate History — ${featureId}\n`);
  for (const entry of history) {
    const icon = entry.status === 'PASS' ? '✓' : entry.status === 'PASS_WITH_WAIVER' ? '~' : '✗';
    console.log(`  ${icon} ${entry.timestamp}  ${entry.stage}  ${entry.status}`);
  }

  return ExitCode.SUCCESS;
}

function handleConditions(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first gate conditions <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  const statePath = join(cwd, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    console.error(`stage-state.json not found for ${featureId}`);
    return ExitCode.IO_ERROR;
  }

  const state = readJson<StageState>(statePath);
  const defs = getConditions(state.currentStage);

  console.log(`Gate Conditions — ${featureId} (${state.currentStage})\n`);
  for (const d of defs) {
    console.log(`  ${d.id}  ${d.description}`);
  }

  if (defs.length === 0) {
    console.log('  No conditions defined for this stage.');
  }

  return ExitCode.SUCCESS;
}

function handleGoLiveCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first golive check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = checkGoLive(featureId, cwd);
    console.log(`GoLive Check — ${featureId}\n`);

    for (const c of result.checks) {
      const icon = c.pass ? '[PASS]' : '[FAIL]';
      console.log(`  ${icon.padEnd(7)} ${c.id}: ${c.description}`);
      if (c.detail) console.log(`          ${c.detail}`);
    }

    console.log(`\nResult: ${result.pass ? 'READY' : 'NOT READY'}`);
    if (result.degraded) {
      console.log(`confirm_policy degraded to: ${result.confirmPolicy}`);
    }

    return result.pass ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
  } catch {
    console.error(`Failed to run GoLive check for ${featureId}`);
    return ExitCode.IO_ERROR;
  }
}

function printGateHelp(): void {
  console.log('Usage: spec-first gate <subcommand>\n');
  console.log('Subcommands:');
  console.log('  check       Evaluate Gate conditions for current stage');
  console.log('  history     View gate evaluation history');
  console.log('  conditions  List Gate conditions for current stage');
}
