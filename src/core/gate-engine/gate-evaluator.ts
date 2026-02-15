/**
 * Gate 条件评估引擎
 * 读取 stage-state → 评估当前阶段 Gate 条件 → 检查豁免 → 输出三态结果
 */
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import type {
  Stage, GateStatus, GateResult, ConditionResult, WaiverRef,
  CoverageMetrics, StageState, IdType,
} from '../../shared/types.js';
import { readJson, appendJsonl, exists } from '../../shared/fs-utils.js';
import { getCoverage } from '../trace-engine/coverage.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { validateExceptions } from '../trace-engine/exception-validator.js';

// ─── Gate 条件定义 ─────────────────────────────────────────

export interface GateConditionDef {
  id: string;
  description: string;
  /** 评估函数，返回 PASS/FAIL + 可选详情 */
  evaluate: (ctx: EvalContext) => { pass: boolean; detail?: string; scopeFrIds?: string[] };
}

export interface EvalContext {
  featureId: string;
  projectRoot: string;
  stage: Stage;
  state: StageState;
  coverage: CoverageMetrics;
}

/** 每个阶段的 Gate 条件表 */
const GATE_CONDITIONS: Partial<Record<Stage, GateConditionDef[]>> = {};

// ─── 00_init 条件 ──────────────────────────────────────────
GATE_CONDITIONS['00_init' as Stage] = [
  {
    id: 'G-INIT-01',
    description: 'Feature directory exists',
    evaluate: (ctx) => {
      const dir = join(ctx.projectRoot, 'specs', ctx.featureId);
      return { pass: exists(dir), detail: dir };
    },
  },
  {
    id: 'G-INIT-02',
    description: 'Mode/Size/Platforms confirmed',
    evaluate: (ctx) => {
      const { mode, size, platforms } = ctx.state;
      const pass = !!mode && !!size && Array.isArray(platforms) && platforms.length > 0;
      return { pass, detail: `mode=${mode} size=${size} platforms=${platforms?.join(',')}` };
    },
  },
  {
    id: 'G-INIT-03',
    description: 'stage-state.json exists',
    evaluate: (ctx) => {
      const p = join(ctx.projectRoot, 'specs', ctx.featureId, 'stage-state.json');
      return { pass: exists(p) };
    },
  },
];

// ─── 01_specify 条件 ─────────────────────────────────────
GATE_CONDITIONS['01_specify' as Stage] = [
  {
    id: 'G-SPEC-01',
    description: 'spec.md exists',
    evaluate: (ctx) => {
      const p = join(ctx.projectRoot, 'specs', ctx.featureId, 'spec.md');
      return { pass: exists(p) };
    },
  },
  {
    id: 'G-SPEC-02',
    description: 'FR/NFR IDs assigned (matrix has FR rows)',
    evaluate: (ctx) => {
      const rows = parseMatrix(ctx.featureId, ctx.projectRoot);
      const frCount = rows.filter(r => r.type === 'FR').length;
      return { pass: frCount > 0, detail: `FR count: ${frCount}` };
    },
  },
];

// ─── 02_design 条件 ──────────────────────────────────────
GATE_CONDITIONS['02_design' as Stage] = [
  {
    id: 'G-DESIGN-01',
    description: 'design.md exists',
    evaluate: (ctx) => {
      const p = join(ctx.projectRoot, 'specs', ctx.featureId, 'design.md');
      return { pass: exists(p) };
    },
  },
  {
    id: 'G-DESIGN-02',
    description: 'API coverage (C2) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C2;
      const uncovered = getUncoveredFrIds(ctx.featureId, ctx.projectRoot, 'DS');
      return {
        pass: val >= 1.0,
        detail: uncovered.length > 0
          ? `C2=${(val * 100).toFixed(1)}% uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C2=${(val * 100).toFixed(1)}%`,
        scopeFrIds: uncovered,
      };
    },
  },
];

// ─── 03_plan 条件 ────────────────────────────────────────
GATE_CONDITIONS['03_plan' as Stage] = [
  {
    id: 'G-PLAN-01',
    description: 'Task coverage (C3) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C3;
      const uncovered = getUncoveredFrIds(ctx.featureId, ctx.projectRoot, 'TASK');
      return {
        pass: val >= 1.0,
        detail: uncovered.length > 0
          ? `C3=${(val * 100).toFixed(1)}% uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C3=${(val * 100).toFixed(1)}%`,
        scopeFrIds: uncovered,
      };
    },
  },
  {
    id: 'G-PLAN-02',
    description: 'Task compliance (C8) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C8;
      return { pass: val >= 1.0, detail: `C8=${(val * 100).toFixed(1)}%` };
    },
  },
];

// ─── 04_implement 条件 ───────────────────────────────────
GATE_CONDITIONS['04_implement' as Stage] = [
  {
    id: 'G-IMPL-01',
    description: 'Unit test coverage (C4) ≥ 80%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C4;
      const uncovered = getUncoveredFrIds(ctx.featureId, ctx.projectRoot, 'TC');
      return {
        pass: val >= 0.8,
        detail: uncovered.length > 0
          ? `C4=${(val * 100).toFixed(1)}% uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C4=${(val * 100).toFixed(1)}%`,
        scopeFrIds: uncovered,
      };
    },
  },
  {
    id: 'G-IMPL-02',
    description: 'PR compliance (C7) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C7;
      return { pass: val >= 1.0, detail: `C7=${(val * 100).toFixed(1)}%` };
    },
  },
];

// ─── 05_verify 条件 ──────────────────────────────────────
GATE_CONDITIONS['05_verify' as Stage] = [
  {
    id: 'G-VERIFY-01',
    description: 'Test coverage FR (C4) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C4;
      const uncovered = getUncoveredFrIds(ctx.featureId, ctx.projectRoot, 'TC');
      return {
        pass: val >= 1.0,
        detail: uncovered.length > 0
          ? `C4=${(val * 100).toFixed(1)}% uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C4=${(val * 100).toFixed(1)}%`,
        scopeFrIds: uncovered,
      };
    },
  },
  {
    id: 'G-VERIFY-02',
    description: 'Test coverage AC (C5) ≥ 90% for M/L',
    evaluate: (ctx) => {
      const threshold = (ctx.state.size === 'S') ? 0.6 : 0.9;
      const val = ctx.coverage.C5;
      const uncovered = getUncoveredFrIds(ctx.featureId, ctx.projectRoot, 'TC');
      return {
        pass: val >= threshold,
        detail: uncovered.length > 0
          ? `C5=${(val * 100).toFixed(1)}% (threshold=${threshold * 100}%) uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C5=${(val * 100).toFixed(1)}% (threshold=${threshold * 100}%)`,
        scopeFrIds: uncovered,
      };
    },
  },
  {
    id: 'G-VERIFY-03',
    description: 'TC compliance (C9) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C9;
      return { pass: val >= 1.0, detail: `C9=${(val * 100).toFixed(1)}%` };
    },
  },
];

// ─── 06_wrap_up 条件 ─────────────────────────────────────
GATE_CONDITIONS['06_wrap_up' as Stage] = [
  {
    id: 'G-WRAP-01',
    description: 'Implementation coverage (C6) = 100%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C6;
      return { pass: val >= 1.0, detail: `C6=${(val * 100).toFixed(1)}%` };
    },
  },
  {
    id: 'G-WRAP-02',
    description: 'All matrix entries in terminal status',
    evaluate: (ctx) => {
      const rows = parseMatrix(ctx.featureId, ctx.projectRoot);
      const terminal = new Set(['Accepted', 'Cancelled', 'Exception']);
      const nonTerminal = rows.filter(r => !terminal.has(r.status));
      return {
        pass: nonTerminal.length === 0,
        detail: nonTerminal.length > 0
          ? `${nonTerminal.length} non-terminal: ${nonTerminal.slice(0, 3).map(r => r.id).join(', ')}`
          : 'All terminal',
      };
    },
  },
];

// ─── 07_release 条件 ─────────────────────────────────────
GATE_CONDITIONS['07_release' as Stage] = [
  {
    id: 'G-REL-01',
    description: 'Smoke test report exists',
    evaluate: (ctx) => {
      const p = join(ctx.projectRoot, 'specs', ctx.featureId, 'reports', 'smoke-test-report.md');
      return { pass: exists(p) };
    },
  },
  {
    id: 'G-REL-02',
    description: 'Release note exists',
    evaluate: (ctx) => {
      const p = join(ctx.projectRoot, 'specs', ctx.featureId, 'reports', 'release-note.md');
      return { pass: exists(p) };
    },
  },
];

// ─── 核心评估函数 ─────────────────────────────────────────

/** 获取指定阶段的 Gate 条件定义 */
export function getConditions(stage: Stage): GateConditionDef[] {
  return GATE_CONDITIONS[stage] ?? [];
}

/** 评估 Gate：条件检查 + 豁免匹配 → 三态结果 */
export function evaluateGate(featureId: string, projectRoot: string): GateResult {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  const state = readJson<StageState>(statePath);
  const stage = state.currentStage;

  // 构建评估上下文
  const coverage = getCoverage(featureId, projectRoot);
  const ctx: EvalContext = { featureId, projectRoot, stage, state, coverage };

  // 评估所有条件
  const defs = getConditions(stage);
  const conditions: ConditionResult[] = [];

  for (const def of defs) {
    const result = def.evaluate(ctx);
    conditions.push({
      id: def.id,
      description: def.description,
      status: result.pass ? 'PASS' : 'FAIL',
      detail: result.detail,
      scopeFrIds: result.scopeFrIds,
    });
  }

  // 检查豁免：将 FAIL 条件与 valid exceptions 匹配
  const waivers: WaiverRef[] = [];
  const failedIds = conditions.filter(c => c.status === 'FAIL').map(c => c.id);

  if (failedIds.length > 0) {
    const rfcStatuses = loadRfcStatuses(featureId, projectRoot);
    const { valid } = validateExceptions(featureId, projectRoot, rfcStatuses);

    const usedExceptions = new Set<string>();
    for (const ex of valid) {
      const matched = conditions.filter(
        c => c.status === 'FAIL' && Array.isArray(c.scopeFrIds) && c.scopeFrIds.includes(ex.frId),
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

  // 聚合三态结果
  const hasFailure = conditions.some(c => c.status === 'FAIL');
  const hasWaiver = conditions.some(c => c.status === 'WAIVER');
  let status: GateStatus;
  if (hasFailure) {
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
    suggestions: hasFailure
      ? conditions.filter(c => c.status === 'FAIL').map(c => `Fix: ${c.description} (${c.detail ?? ''})`)
      : undefined,
  };

  // 写入 gate-history.jsonl
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  appendJsonl(historyPath, {
    event: 'gate_eval',
    featureId,
    ...gateResult,
  });

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
      const isLegacy = typeof entry.status === 'string'
        && typeof entry.stage === 'string'
        && Array.isArray(entry.conditions);
      if (!isGateEval && !isLegacy) continue;
      records.push(entry as unknown as GateResult);
    } catch {
      // 跳过损坏行，避免单行错误导致全量历史不可读
    }
  }
  return records;
}

// ─── 辅助函数 ─────────────────────────────────────────────

/** 加载 Feature 下所有 RFC 的状态 */
function loadRfcStatuses(featureId: string, projectRoot: string): Map<string, string> {
  const rfcDir = join(projectRoot, 'specs', featureId, 'rfc');
  if (!exists(rfcDir)) return new Map();

  const statuses = new Map<string, string>();
  for (const entry of readdirSync(rfcDir)) {
    if (!entry.endsWith('.rfc.json')) continue;
    const p = join(rfcDir, entry);
    const rfc = readJson<RfcStatusFile>(p);
    if (!rfc.id || !rfc.status) continue;
    statuses.set(rfc.id, rfc.status);
  }
  return statuses;
}

interface RfcStatusFile {
  id: string;
  status: string;
}

function getUncoveredFrIds(
  featureId: string,
  projectRoot: string,
  downstreamType: IdType,
): string[] {
  const rows = parseMatrix(featureId, projectRoot);
  const frRows = rows.filter((r) => r.type === 'FR');
  if (frRows.length === 0) return [];

  const covered = new Set<string>();
  const downstreamRows = rows.filter((r) => r.type === downstreamType);
  for (const row of downstreamRows) {
    for (const up of row.upstream ?? []) {
      covered.add(up);
    }
  }

  return frRows.filter((fr) => !covered.has(fr.id)).map((fr) => fr.id);
}
