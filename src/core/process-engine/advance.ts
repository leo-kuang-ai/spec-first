/**
 * 阶段推进 + Feature 取消
 * advance: Gate check → 推进 → history → 审计
 * cancel: 任意非终态 → 09_cancelled
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { StageState, StageHistoryEntry } from '../../shared/types.js';
import { readJsonChecked, writeJson, exists } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { writeLog } from '../../shared/logger.js';
import { loadConfig, resetConfigCache } from '../../shared/config-schema.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';
import { evaluateGate } from '../gate-engine/gate-evaluator.js';
import { syncAgentContextFromDesign } from '../tool-integration/context-sync.js';
import { checkDependencies } from './dependency-checker.js';

export class GateUnavailableError extends Error {
  constructor(message = 'GateEngine 不可用') {
    super(message);
    this.name = 'GateUnavailableError';
  }
}

export class GateFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GateFailedError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface AdvanceOptions {
}

export interface AdvanceResult {
  from: Stage;
  to: Stage;
  gateResult: string;
}

/** 顺序阶段链（不含 CANCELLED） */
const STAGE_ORDER: readonly Stage[] = [
  Stage.INIT, Stage.SPECIFY, Stage.DESIGN, Stage.PLAN,
  Stage.IMPLEMENT, Stage.VERIFY, Stage.WRAP_UP, Stage.RELEASE, Stage.DONE,
];

function getStatePath(featureId: string, root: string): string {
  return join(root, 'specs', featureId, 'stage-state.json');
}

function getGateLogPath(featureId: string, root: string): string {
  return join(root, 'specs', featureId, 'gate-history.jsonl');
}

function getFindingsPath(featureId: string, root: string): string {
  return join(root, 'specs', featureId, 'findings.md');
}

function loadState(featureId: string, root: string): StageState {
  const p = getStatePath(featureId, root);
  if (!exists(p)) throw new Error(`未找到 Feature：${featureId}`);
  return readJsonChecked(p, isStageState);
}

function nextStageInChain(current: Stage): Stage {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
    throw new Error(`阶段 ${current} 之后不存在下一阶段`);
  }
  return STAGE_ORDER[idx + 1];
}

function appendFindings(featureId: string, root: string, msg: string): void {
  const p = getFindingsPath(featureId, root);
  if (exists(p)) {
    appendFileSync(p, `\n- [${new Date().toISOString()}] ${msg}\n`, 'utf-8');
  }
}

function saveState(featureId: string, root: string, state: StageState): void {
  writeJson(getStatePath(featureId, root), state);
}

/**
 * 推进 Feature 到下一阶段
 * Phase A 降级：GateEngine 未就绪时根据 pilot_mode 决定放行/阻断
 */
export function advance(
  featureId: string,
  projectRoot: string,
  _options: AdvanceOptions = {},
): AdvanceResult {
  resetConfigCache();
  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} 已处于终态阶段 ${from}`);
  }

  const to = nextStageInChain(from);
  assertTransitionAllowed(from, to);

  let gateResult: string;

  // 正常路径：先执行依赖检查，再执行 Gate 校验
  const depCheck = checkDependencies(featureId, to, projectRoot);
  if (!depCheck.pass) {
    appendFindings(featureId, projectRoot,
      `DEPENDENCY_CHECK_FAIL: 缺失项:\n${depCheck.missing.map(m => `  - ${m}`).join('\n')}`);
    throw new GateFailedError(
      `阶段 ${to} 的依赖检查未通过。缺失项:\n${depCheck.missing.map(m => `  - ${m}`).join('\n')}`
    );
  }

  try {
    const gate = evaluateGate(featureId, projectRoot);
    gateResult = gate.status;
    if (gate.status === 'FAIL') {
      throw new GateFailedError(
        `阶段 ${from} 的 Gate 未通过。请先修复失败条件，再推进 ${from} → ${to}。`,
      );
    }
  } catch (e) {
    if (e instanceof GateFailedError) {
      throw e;
    }
    if (e instanceof GateUnavailableError) {
      const config = loadConfig(projectRoot);
      if (config.gate.pilot_mode) {
        gateResult = 'PILOT_PASS';
        appendFindings(featureId, projectRoot,
          `PILOT_PASS: ${from} → ${to} (gate unavailable, pilot_mode=true)`);
      } else {
        throw new GateUnavailableError(
          `Gate 检查不可用且 pilot_mode=false。` +
          `无法推进 ${from} → ${to}。请开启 pilot_mode。`
        );
      }
    } else {
      // Gate 执行异常时，按不可用降级策略处理
      const config = loadConfig(projectRoot);
      if (config.gate.pilot_mode) {
        gateResult = 'PILOT_PASS';
        appendFindings(featureId, projectRoot,
          `PILOT_PASS: ${from} → ${to} (gate runtime error, pilot_mode=true)`);
      } else {
        throw new GateUnavailableError(
          `Gate 运行异常且 pilot_mode=false。` +
          `无法推进 ${from} → ${to}。请开启 pilot_mode。`
        );
      }
    }
  }

  // 更新状态
  const now = new Date().toISOString();
  const entry: StageHistoryEntry = { from, to, timestamp: now, gateResult };
  state.currentStage = to;
  state.history.push(entry);
  state.terminal = isTerminal(to);
  state.updatedAt = now;
  saveState(featureId, projectRoot, state);

  // 写入 gate-history.jsonl
  writeLog(getGateLogPath(featureId, projectRoot), {
    event: 'stage_advance',
    action: 'advance',
    from,
    to,
    gateStatus: gateResult,
    featureId,
  });

  if (from === Stage.DESIGN) {
    const sync = syncAgentContextFromDesign(featureId, projectRoot);
    if (sync.updated.length > 0) {
      appendFindings(featureId, projectRoot, `Context Sync: ${sync.updated.join(', ')}`);
    }
    for (const warning of sync.warnings) {
      appendFindings(featureId, projectRoot, `Context Sync Warning: ${warning}`);
    }
  }

  return { from, to, gateResult };
}

/**
 * 取消 Feature — 任意非终态 → 09_cancelled
 */
export function cancel(
  featureId: string,
  projectRoot: string,
  reason: string,
): AdvanceResult {
  if (!reason) {
    throw new Error('取消原因不能为空');
  }

  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} 已处于终态阶段 ${from}`);
  }

  const to = Stage.CANCELLED;
  assertTransitionAllowed(from, to);

  const now = new Date().toISOString();
  const entry: StageHistoryEntry = {
    from, to, timestamp: now, gateResult: 'CANCELLED', reason,
  };
  state.currentStage = to;
  state.history.push(entry);
  state.terminal = true;
  state.updatedAt = now;
  saveState(featureId, projectRoot, state);

  writeLog(getGateLogPath(featureId, projectRoot), {
    event: 'stage_cancel',
    action: 'cancel',
    from,
    to,
    reason,
    featureId,
  });

  return { from, to, gateResult: 'CANCELLED' };
}
