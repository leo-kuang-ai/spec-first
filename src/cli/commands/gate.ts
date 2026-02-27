/**
 * Gate CLI 命令组
 * gate check / gate history / gate conditions / golive check
 */
import { ExitCode } from '../../shared/types.js';
import { evaluateGate, getConditions, getGateHistory } from '../../core/gate-engine/gate-evaluator.js';
import { checkGoLive } from '../../core/gate-engine/golive.js';
import { readJson, exists } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';

export function handleGate(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'check': return handleCheck(args.slice(1));
    case 'history': return handleHistory(args.slice(1));
    case 'conditions': return handleConditions(args.slice(1));
    default:
      printGateHelp();
      if (sub) console.error(`未知 gate 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

export function handleGoLive(args: string[]): number {
  const sub = args[0];
  if (sub !== 'check') {
    console.log('用法：spec-first golive check [featureId]');
    return ExitCode.VALIDATION_ERROR;
  }
  return handleGoLiveCheck(args.slice(1));
}

// ─── Subcommand Handlers ─────────────────────────────────

function handleCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first gate check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = evaluateGate(featureId, cwd);
    console.log(`Gate 检查 — ${featureId} (${result.stage})\n`);
    console.log(`结果：${result.status}\n`);

    for (const c of result.conditions) {
      const icon = c.status === 'PASS' ? '[OK]' : c.status === 'WAIVER' ? '[WVR]' : '[FAIL]';
      console.log(`  ${icon.padEnd(7)} ${c.description}`);
      if (c.detail) console.log(`          ${c.detail}`);
    }

    if (result.suggestions && result.suggestions.length > 0) {
      console.log('\n建议：');
      for (const s of result.suggestions) console.log(`  - ${s}`);
    }

    return result.status === 'FAIL' ? ExitCode.VALIDATION_ERROR : ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Gate 评估失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleHistory(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first gate history <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const history = getGateHistory(featureId, process.cwd());
  if (history.length === 0) {
    console.log('未找到 gate 历史记录。');
    return ExitCode.SUCCESS;
  }

  console.log(`Gate 历史 — ${featureId}\n`);
  for (const entry of history) {
    const icon = entry.status === 'PASS' ? '✓' : entry.status === 'PASS_WITH_WAIVER' ? '~' : '✗';
    console.log(`  ${icon} ${entry.timestamp}  ${entry.stage}  ${entry.status}`);
  }

  return ExitCode.SUCCESS;
}

function handleConditions(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first gate conditions <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  const statePath = join(cwd, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    console.error(`未找到 stage-state.json：${featureId}`);
    return ExitCode.IO_ERROR;
  }

  const state = readJson<StageState>(statePath);
  const defs = getConditions(state.currentStage);

  console.log(`Gate 条件 — ${featureId} (${state.currentStage})\n`);
  for (const d of defs) {
    console.log(`  ${d.id}  ${d.description}`);
  }

  if (defs.length === 0) {
    console.log('  当前阶段未定义条件。');
  }

  return ExitCode.SUCCESS;
}

function handleGoLiveCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first golive check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = checkGoLive(featureId, cwd);
    console.log(`上线检查 — ${featureId}\n`);

    for (const c of result.checks) {
      const icon = c.pass ? '[通过]' : '[失败]';
      console.log(`  ${icon.padEnd(7)} ${c.id}: ${c.description}`);
      if (c.detail) console.log(`          ${c.detail}`);
    }

    console.log(`\n结果：${result.pass ? '可上线' : '未就绪'}`);
    if (result.degraded) {
      console.log(`confirm_policy 已降级为：${result.confirmPolicy}`);
    }

    return result.pass ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
  } catch (e) {
    console.error(`上线检查执行失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function printGateHelp(): void {
  console.log('用法：spec-first gate <subcommand>\n');
  console.log('子命令：');
  console.log('  check       校验当前阶段 Gate 条件');
  console.log('  history     查看 Gate 评估历史');
  console.log('  conditions  列出当前阶段 Gate 条件');
}
