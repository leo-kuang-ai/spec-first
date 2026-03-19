/**
 * 阶段推进 + Feature 取消
 * advance: Gate check → 推进 → history → 审计
 * cancel: 任意非终态 → 09_cancelled
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { StageState, StageHistoryEntry } from '../../shared/types.js';
import { readJsonChecked, writeJson, exists, writeMarkdown } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { writeLog } from '../../shared/logger.js';
import { loadConfig, resetConfigCache } from '../../shared/config-schema.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';
import { evaluateGate } from '../gate-engine/gate-evaluator.js';
import { syncAgentContextFromDesign } from '../tool-integration/context-sync.js';
import { checkDependencies } from './dependency-checker.js';
import { getNextStage } from './next-step-decider.js';
import {
  applyProjectCognitionWriteback,
  formatProjectCognitionWritebackFinding,
} from '../skill-runtime/first-governance.js';

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

export interface AdvanceOptions {
  skipProjectCognitionGovernance?: boolean;
}

export interface AdvanceResult {
  from: Stage;
  to: Stage;
  gateResult: string;
}

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
  const next = getNextStage(current);
  if (!next) {
    throw new Error(`阶段 ${current} 之后不存在下一阶段`);
  }
  return next;
}

function appendFindings(featureId: string, root: string, msg: string): void {
  const p = getFindingsPath(featureId, root);
  if (exists(p)) {
    appendFileSync(p, `\n- [${new Date().toISOString()}] ${msg}\n`, 'utf-8');
  }
}

function sanitizeStageState(state: StageState): StageState {
  return {
    featureId: state.featureId,
    mode: state.mode,
    size: state.size,
    platforms: state.platforms,
    backgroundInputStatus: state.backgroundInputStatus,
    stageStatus: state.stageStatus,
    autoAdvancePolicy: state.autoAdvancePolicy,
    lastVerifiedAt: state.lastVerifiedAt,
    lastSuggestedCommand: state.lastSuggestedCommand,
    mergedRules: state.mergedRules,
    currentStage: state.currentStage,
    history: state.history,
    terminal: state.terminal,
    title: state.title,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
}

function saveState(featureId: string, root: string, state: StageState): void {
  writeJson(getStatePath(featureId, root), sanitizeStageState(state));
}

/**
 * 推进 Feature 到下一阶段
 *
 * 完整推进链：
 * 1. 依赖检查 (checkDependencies) - 验证目标阶段所需产物是否齐全
 * 2. Gate 校验 (evaluateGate) - 执行 Layer1 内置条件 + Layer2 命令条件
 * 3. Warning 审计 - 记录非阻塞性失败条件到 findings.md
 * 4. 状态更新 - 写入 stage-state.json + gate-history.jsonl
 * 5. 特殊处理 - Context Sync (02_design→03_plan) / Auto-skip (07_release→08_done)
 *
 * Phase A 降级：GateEngine 未就绪时根据 pilot_mode 决定放行/阻断
 *
 * 当前行为说明：
 * - 07_release 为预留发布阶段
 * - 当前默认自动收口到 08_done，以保持主流程顺滑
 * - 后续若接入真实发布自动化，可在 07_release 内扩展显式发布动作与更严格门禁
 */
export function advance(
  featureId: string,
  projectRoot: string,
  _options: AdvanceOptions = {}
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
  const profile = state.mergedRules?.profile ?? 'default-simplified';

  // 正常路径：先执行依赖检查，再执行 Gate 校验
  const depCheck = checkDependencies(featureId, to, projectRoot, profile);
  if (!depCheck.pass) {
    appendFindings(
      featureId,
      projectRoot,
      `DEPENDENCY_CHECK_FAIL: 缺失项:\n${depCheck.missing.map((m) => `  - ${m}`).join('\n')}`
    );
    throw new GateFailedError(
      `阶段 ${to} 的依赖检查未通过。缺失项:\n${depCheck.missing.map((m) => `  - ${m}`).join('\n')}`
    );
  }

  try {
    const gate = evaluateGate(featureId, projectRoot);
    gateResult = gate.status;
    if (gate.status === 'FAIL') {
      throw new GateFailedError(
        `阶段 ${from} 的 Gate 未通过。请先修复失败条件，再推进 ${from} → ${to}。`
      );
    }
    if (gate.status === 'PASS_WITH_WAIVER' && gate.waivers) {
      appendFindings(
        featureId,
        projectRoot,
        `WAIVER: ${gate.waivers.map((w) => `${w.exceptionId} (RFC: ${w.rfcId})`).join(', ')}`
      );
    }
    if (gate.status === 'PASS' || gate.status === 'PASS_WITH_WAIVER') {
      const warnings = gate.conditions.filter((c) => c.status === 'FAIL' && c.blocking === false);
      for (const w of warnings) {
        appendFindings(featureId, projectRoot, `GATE_WARNING: ${w.id} ${w.detail ?? ''}`);
      }
    }
  } catch (e) {
    if (e instanceof GateFailedError) {
      throw e;
    }
    if (e instanceof GateUnavailableError) {
      const config = loadConfig(projectRoot);
      if (config.gate.pilot_mode) {
        gateResult = 'PILOT_PASS';
        appendFindings(
          featureId,
          projectRoot,
          `PILOT_PASS: ${from} → ${to} (gate unavailable, pilot_mode=true)`
        );
      } else {
        throw new GateUnavailableError(
          `Gate 检查不可用且 pilot_mode=false。` + `无法推进 ${from} → ${to}。请开启 pilot_mode。`
        );
      }
    } else {
      // Gate 执行异常时，按不可用降级策略处理
      const config = loadConfig(projectRoot);
      const errorMsg = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;
      if (config.gate.pilot_mode) {
        gateResult = 'PILOT_PASS';
        appendFindings(
          featureId,
          projectRoot,
          `PILOT_PASS: ${from} → ${to} (gate runtime error: ${errorMsg}${errorStack ? '\nStack: ' + errorStack : ''})`
        );
      } else {
        throw new GateUnavailableError(
          `Gate 运行异常且 pilot_mode=false。` + `无法推进 ${from} → ${to}。请开启 pilot_mode。`
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

  let finalTo = to;
  let finalGateResult = gateResult;

  // 07_release 自动跳转到 08_done（当前保持自动收口）
  if (to === Stage.RELEASE) {
    appendFindings(
      featureId,
      projectRoot,
      `AUTO_ADVANCE: ${to} → ${Stage.DONE} (发布阶段当前自动收口，后续可扩展真实发布动作)`
    );
    writeLog(getGateLogPath(featureId, projectRoot), {
      event: 'release_auto_skip',
      message: '发布阶段当前自动收口，后续可扩展真实发布动作',
      featureId,
    });
    const doneResult = advance(featureId, projectRoot, {
      ..._options,
      skipProjectCognitionGovernance: true,
    });
    finalTo = doneResult.to;
    finalGateResult = doneResult.gateResult;
  }

  // 到达终态时清空 current 文件
  if (finalTo === Stage.DONE || finalTo === Stage.CANCELLED) {
    const currentFile = join(projectRoot, '.spec-first/current');
    if (exists(currentFile)) {
      writeMarkdown(currentFile, '');
    }
  }

  if (!_options.skipProjectCognitionGovernance) {
    const governanceTriggerStage =
      from === Stage.WRAP_UP ? Stage.WRAP_UP : finalTo === Stage.DONE ? Stage.DONE : undefined;
    if (governanceTriggerStage) {
      try {
        const governance = applyProjectCognitionWriteback(
          featureId,
          projectRoot,
          governanceTriggerStage
        );
        appendFindings(featureId, projectRoot, formatProjectCognitionWritebackFinding(governance));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        appendFindings(featureId, projectRoot, `PROJECT_COGNITION_BLOCKED: ${message}`);
      }
    }
  }

  return { from, to: finalTo, gateResult: finalGateResult };
}

/**
 * 取消 Feature — 任意非终态 → 09_cancelled
 */
export function cancel(featureId: string, projectRoot: string, reason: string): AdvanceResult {
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
    from,
    to,
    timestamp: now,
    gateResult: 'CANCELLED',
    reason,
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
