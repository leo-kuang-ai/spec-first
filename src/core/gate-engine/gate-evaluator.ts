/**
 * Gate 条件评估引擎
 * 读取 stage-state → 评估当前阶段 Gate 条件 → 检查豁免 → 输出三态结果
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type {
  Stage,
  GateStatus,
  GateResult,
  ConditionResult,
  WaiverRef,
} from '../../shared/types.js';
import { readJsonChecked, appendJsonl, exists } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { getCoverage } from '../trace-engine/coverage.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { validateExceptions } from '../trace-engine/exception-validator.js';
import { runCommandGate } from './command-gate.js';
import { loadRfcStatuses } from '../change-mgr/rfc.js';
import { GATE_CONDITIONS, shouldSkipCondition, type GateConditionDef, type EvalContext } from './condition-registry.js';

// ─── 导出类型 ─────────────────────────────────────────────
export type { GateConditionDef, EvalContext };

// ─── 核心评估函数 ─────────────────────────────────────────

export function getProjectTypeFromConstitution(featureId: string, projectRoot: string): string {
  try {
    const constitutionPath = join(projectRoot, 'specs', featureId, 'constitution.md');
    const content = readFileSync(constitutionPath, 'utf-8');
    const match = /项目类型[*\s]*[:：]\s*(\S+)/i.exec(content);
    return match?.[1] || 'fullstack';
  } catch {
    return 'fullstack';
  }
}

/** 获取指定阶段的 Gate 条件定义 */
export function getConditions(stage: Stage, projectType?: string, profile?: string): GateConditionDef[] {
  const conditions = GATE_CONDITIONS[stage] ?? [];
  const filtered = projectType
    ? conditions.filter((c) => !shouldSkipCondition(c.id, projectType))
    : conditions;

  if (profile !== 'strict') return filtered;

  // strict 不恢复已删除 Gate，但会把默认 warning 提升为 blocking
  return filtered.map((c) =>
    c.blocking === false
      ? {
          ...c,
          blocking: true,
          description: c.description.replace(/\s*\(warning\)\s*/i, ''),
        }
      : c
  );
}

/** 评估 Gate：条件检查 + 豁免匹配 → 三态结果 */
export interface EvaluateGateOptions {
  persist?: boolean;
}

export function evaluateGate(
  featureId: string,
  projectRoot: string,
  options: EvaluateGateOptions = {}
): GateResult {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  const state = readJsonChecked(statePath, isStageState);
  const stage = state.currentStage;

  // 构建评估上下文（一次解析，全程复用）
  const rows = parseMatrix(featureId, projectRoot);
  const rfcStatuses = loadRfcStatuses(featureId, projectRoot);
  const coverage = getCoverage(featureId, projectRoot, rows, rfcStatuses);
  const ctx: EvalContext = { featureId, projectRoot, stage, state, coverage, rows, rfcStatuses };

  const projectType = getProjectTypeFromConstitution(featureId, projectRoot);
  const profile = state.mergedRules?.profile ?? 'default-simplified';
  const defs = getConditions(stage, projectType, profile);
  const conditions: ConditionResult[] = [];

  for (const def of defs) {
    const result = def.evaluate(ctx);
    // 硬编码 warning-only 条件
    const isWarningOnly = ['G-SPEC-00', 'G-SPEC-03', 'G-DESIGN-03'].includes(def.id);
    const blocking = isWarningOnly ? false : (result.blocking ?? def.blocking ?? true);
    conditions.push({
      id: def.id,
      description: def.description,
      status: result.pass ? 'PASS' : 'FAIL',
      detail: result.detail,
      scopeFrIds: result.scopeFrIds,
      blocking,
    });
  }

  // Layer2 命令 Gate：从 mergedRules.gateConditions 读取带 command 的条件并执行
  // 注意：mergedRules 已在规则合并阶段完成 profile 过滤，此处无需再次过滤
  // 行为：执行所有带 command 的条件，跳过已被 Layer1 评估的重复 ID
  const l2Conditions = (state.mergedRules?.gateConditions?.[stage] ?? []) as Array<{
    id: string;
    description: string;
    command?: string;
  }>;
  const evaluatedIds = new Set(conditions.map((c) => c.id));
  for (const l2 of l2Conditions) {
    if (!l2.command || evaluatedIds.has(l2.id)) continue;
    const cmdResult = runCommandGate(l2.command, projectRoot);
    conditions.push({
      id: l2.id,
      description: l2.description,
      status: cmdResult.pass ? 'PASS' : 'FAIL',
      detail: cmdResult.detail,
    });
  }

  // 检查豁免：只匹配 blocking failures
  const waivers: WaiverRef[] = [];
  const blockingFailures = conditions.filter((c) => c.status === 'FAIL' && c.blocking !== false);

  if (blockingFailures.length > 0) {
    const { valid } = validateExceptions(featureId, projectRoot, ctx.rfcStatuses);

    const usedExceptions = new Set<string>();
    for (const ex of valid) {
      const matched = blockingFailures.filter(
        (c) => Array.isArray(c.scopeFrIds) && c.scopeFrIds.includes(ex.frId)
      );
      if (matched.length === 0) continue;

      for (const c of matched) {
        c.status = 'WAIVER';
      }

      if (!usedExceptions.has(ex.id)) {
        usedExceptions.add(ex.id);
        waivers.push({
          exceptionId: ex.id,
          rfcId: ex.rfcId,
          expiresAt: ex.expiresAt,
          rollbackPoint: ex.rollbackPoint,
        });
      }
    }
  }

  // 聚合三态结果：warning 不影响 PASS/FAIL 判定
  const hasBlockingFailure = conditions.some((c) => c.status === 'FAIL' && c.blocking !== false);
  const hasWaiver = conditions.some((c) => c.status === 'WAIVER');
  let status: GateStatus;
  if (hasBlockingFailure) {
    status = 'FAIL';
  } else if (hasWaiver) {
    status = 'PASS_WITH_WAIVER';
  } else {
    status = 'PASS';
  }

  const gateResult: GateResult = {
    status,
    stage,
    timestamp: new Date().toISOString(),
    conditions,
    waivers: waivers.length > 0 ? waivers : undefined,
    suggestions: hasBlockingFailure
      ? conditions
          .filter((c) => c.status === 'FAIL' && c.blocking !== false)
          .map((c) => `Fix: ${c.description} (${c.detail ?? ''})`)
      : undefined,
  };

  // 写入 gate-history.jsonl
  if (options.persist !== false) {
    const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
    appendJsonl(historyPath, {
      event: 'gate_eval',
      featureId,
      ...gateResult,
    });
  }

  return gateResult;
}

/** 读取 Gate 历史记录 */
export function getGateHistory(featureId: string, projectRoot: string): GateResult[] {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!exists(historyPath)) return [];

  const content = readFileSync(historyPath, 'utf-8');
  const records: GateResult[] = [];
  for (const line of content.trim().split('\n').filter(Boolean)) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const isGateEval = entry.event === 'gate_eval';
      const isLegacy =
        typeof entry.status === 'string' &&
        typeof entry.stage === 'string' &&
        Array.isArray(entry.conditions);
      if (!isGateEval && !isLegacy) continue;
      records.push(entry as unknown as GateResult);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;
      console.error(`[gate-evaluator] Failed to parse gate history line: ${errorMsg}${errorStack ? '\nStack: ' + errorStack : ''}`);
    }
  }
  return records;
}
