/**
 * 阶段推进 + Feature 取消
 * advance: Gate check → 推进 → history → 审计
 * cancel: 任意非终态 → 09_cancelled
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { StageState, StageHistoryEntry } from '../../shared/types.js';
import { TERMINAL_STAGES } from '../../shared/types.js';
import { readJson, writeJson, exists } from '../../shared/fs-utils.js';
import { writeLog } from '../../shared/logger.js';
import { loadConfig, resetConfigCache } from '../../shared/config-schema.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';
import { evaluateGate } from '../gate-engine/gate-evaluator.js';

export class GateUnavailableError extends Error {
  constructor(message = 'GateEngine not available') {
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

export interface AdvanceOptions {
  force?: boolean;
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
  if (!exists(p)) throw new Error(`Feature ${featureId} not found`);
  return readJson<StageState>(p);
}

function nextStageInChain(current: Stage): Stage {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
    throw new Error(`No next stage after ${current}`);
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
  options: AdvanceOptions = {},
): AdvanceResult {
  resetConfigCache();
  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} is in terminal stage ${from}`);
  }

  const to = nextStageInChain(from);
  assertTransitionAllowed(from, to);

  let gateResult: string;

  if (options.force) {
    // --force 路径：跳过 Gate
    gateResult = 'FORCE_SKIPPED';
    appendFindings(featureId, projectRoot,
      `FORCE_SKIPPED: ${from} → ${to} (gate check bypassed)`);
  } else {
    // 正常路径：执行 Gate 校验
    try {
      const gate = evaluateGate(featureId, projectRoot);
      gateResult = gate.status;
      if (gate.status === 'FAIL') {
        throw new GateFailedError(
          `Gate failed at ${from}. Fix failed conditions before advancing ${from} → ${to}.`,
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
            `Gate check unavailable and pilot_mode=false. ` +
            `Cannot advance ${from} → ${to}. Enable pilot_mode or use --force.`
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
            `Gate runtime error and pilot_mode=false. ` +
            `Cannot advance ${from} → ${to}. Enable pilot_mode or use --force.`
          );
        }
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
    throw new Error('Cancel reason is required');
  }

  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} is in terminal stage ${from}`);
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
