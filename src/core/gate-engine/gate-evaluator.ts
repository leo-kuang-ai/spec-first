/**
 * Gate 条件评估引擎
 * 读取 stage-state → 评估当前阶段 Gate 条件 → 输出结果
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Stage, GateStatus, GateResult, ConditionResult } from '../../shared/types.js';
import { readJsonChecked, appendJsonl, exists } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { runCommandGate } from './command-gate.js';
import {
  GATE_CONDITIONS,
  shouldSkipCondition,
  type GateConditionDef,
  type EvalContext,
} from './condition-registry.js';

export type { GateConditionDef, EvalContext };

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

export function getConditions(
  stage: Stage,
  projectType?: string,
  profile?: string
): GateConditionDef[] {
  const conditions = GATE_CONDITIONS[stage] ?? [];
  const filtered = projectType
    ? conditions.filter((condition) => !shouldSkipCondition(condition.id, projectType))
    : conditions;

  if (profile !== 'strict') return filtered;

  return filtered.map((condition) =>
    condition.blocking === false
      ? {
          ...condition,
          blocking: true,
          description: condition.description.replace(/\s*\(warning\)\s*/i, ''),
        }
      : condition
  );
}

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
  const projectType = getProjectTypeFromConstitution(featureId, projectRoot);
  const profile = state.mergedRules?.profile ?? 'default-simplified';
  const defs = getConditions(stage, projectType, profile);

  const ctx: EvalContext = { featureId, projectRoot, stage, state };
  const conditions: ConditionResult[] = defs.map((def) => {
    const result = def.evaluate(ctx);
    return {
      id: def.id,
      description: def.description,
      status: result.pass ? 'PASS' : 'FAIL',
      detail: result.detail,
      blocking: result.blocking ?? def.blocking ?? true,
    };
  });

  const l2Conditions = (state.mergedRules?.gateConditions?.[stage] ?? []) as Array<{
    id: string;
    description: string;
    command?: string;
  }>;
  const evaluatedIds = new Set(conditions.map((condition) => condition.id));
  for (const l2 of l2Conditions) {
    if (!l2.command || evaluatedIds.has(l2.id)) continue;
    const cmdResult = runCommandGate(l2.command, projectRoot);
    conditions.push({
      id: l2.id,
      description: l2.description,
      status: cmdResult.pass ? 'PASS' : 'FAIL',
      detail: cmdResult.detail,
      blocking: true,
    });
  }

  const hasBlockingFailure = conditions.some(
    (condition) => condition.status === 'FAIL' && condition.blocking !== false
  );
  const hasWarning = conditions.some(
    (condition) => condition.status === 'FAIL' && condition.blocking === false
  );
  const status: GateStatus = hasBlockingFailure ? 'FAIL' : 'PASS';

  const gateResult: GateResult = {
    status,
    stage,
    timestamp: new Date().toISOString(),
    conditions,
    suggestions: hasBlockingFailure
      ? conditions
          .filter((condition) => condition.status === 'FAIL' && condition.blocking !== false)
          .map((condition) => `Fix: ${condition.description} (${condition.detail ?? ''})`)
      : hasWarning
        ? conditions
            .filter((condition) => condition.status === 'FAIL' && condition.blocking === false)
            .map((condition) => `Warn: ${condition.description} (${condition.detail ?? ''})`)
        : undefined,
  };

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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[gate-evaluator] Failed to parse gate history line: ${message}`);
    }
  }
  return records;
}
