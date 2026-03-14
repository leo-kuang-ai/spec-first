/**
 * Gate 条件定义注册表
 * 集中管理所有阶段的 Gate 条件定义
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Stage, CoverageMetrics, StageState, MatrixRow, IdType } from '../../shared/types.js';
import { TERMINAL_STATUSES } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { validatePrd } from './prd-validator.js';
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';
import { evaluateConstitutionCompliance } from './constitution-validator.js';
import { statSync } from 'node:fs';
import { getCriticalCountFromAnalysisReport, analyzeArtifacts } from './sca.js';
import { createTraceContext } from '../trace-engine/trace-context.js';
import { loadConfig } from '../../shared/config-schema.js';

export interface GateConditionDef {
  id: string;
  description: string;
  blocking?: boolean;
  evaluate: (ctx: EvalContext) => { pass: boolean; detail?: string; scopeFrIds?: string[]; blocking?: boolean };
}

export interface EvalContext {
  featureId: string;
  projectRoot: string;
  stage: Stage;
  state: StageState;
  coverage: CoverageMetrics;
  rows: MatrixRow[];
  rfcStatuses: Map<string, string>;
}

/** 每个阶段的 Gate 条件表 */
export const GATE_CONDITIONS: Partial<Record<Stage, GateConditionDef[]>> = {};

function formatPercentThreshold(value: number, operator: '>=' | '='): string {
  return `${operator} ${Number((value * 100).toFixed(2))}%`;
}

function getConfiguredGateThreshold(projectRoot: string, gateId: 'G-IMPL-01' | 'G-VERIFY-01'): number {
  return loadConfig(projectRoot).gate.thresholds[gateId].value;
}

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
    id: 'G-SPEC-00',
    description: 'PRD exists and C-PRD ≥ 85% (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const prdPath = join(ctx.projectRoot, 'specs', ctx.featureId, 'prd.md');
      if (!exists(prdPath)) {
        return { pass: false, detail: 'prd.md not found', blocking: false };
      }
      const result = validatePrd(prdPath);
      const frIds = ctx.rows.filter((r) => r.type === 'FR').map((r) => r.id);
      return {
        pass: result.valid && result.score >= 85,
        detail: `C-PRD=${result.score}% errors=${result.errors.length}`,
        scopeFrIds: frIds,
        blocking: false,
      };
    },
  },
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
      const frCount = ctx.rows.filter((r) => r.type === 'FR').length;
      return { pass: frCount > 0, detail: `FR count: ${frCount}` };
    },
  },
  {
    id: 'G-SPEC-03',
    description: 'Spec quality score (C10) ≥ 80% (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const c10 = evaluateSpecQualityScore(ctx.featureId, ctx.projectRoot);
      const frIds = ctx.rows.filter((r) => r.type === 'FR').map((r) => r.id);
      return { pass: c10.pass, detail: c10.detail, scopeFrIds: frIds, blocking: false };
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
    id: 'G-DESIGN-03',
    description: 'Constitution compliance (C11) (warning)',
    blocking: false,
    evaluate: (ctx) => {
      const c11 = evaluateConstitutionCompliance(ctx.featureId, ctx.projectRoot);
      return { pass: c11.pass, detail: c11.detail };
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
      const uncovered = getUncoveredFrIds(ctx.rows, 'TASK');
      return {
        pass: val >= 1.0,
        detail:
          uncovered.length > 0
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
  {
    id: 'G-PLAN-03',
    description: 'Analyze CRITICAL findings = 0',
    evaluate: (ctx) => {
      const analyze = evaluateAnalyzeCriticalFindings(ctx.featureId, ctx.projectRoot);
      return { pass: analyze.pass, detail: analyze.detail };
    },
  },
];

// ─── 04_implement 条件 ───────────────────────────────────
GATE_CONDITIONS['04_implement' as Stage] = [
  {
    id: 'G-IMPL-01',
    description: 'Unit test coverage (C4) meets configured threshold',
    evaluate: (ctx) => {
      const val = ctx.coverage.C4;
      const threshold = getConfiguredGateThreshold(ctx.projectRoot, 'G-IMPL-01');
      const uncovered = getUncoveredFrIds(ctx.rows, 'TC');
      return {
        pass: val >= threshold,
        detail:
          uncovered.length > 0
            ? `C4=${(val * 100).toFixed(1)}% target(${formatPercentThreshold(threshold, '>=')}) uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
            : `C4=${(val * 100).toFixed(1)}% target(${formatPercentThreshold(threshold, '>=')})`,
        scopeFrIds: uncovered,
      };
    },
  },
];

// ─── 05_verify 条件 ──────────────────────────────────────
GATE_CONDITIONS['05_verify' as Stage] = [
  {
    id: 'G-VERIFY-01',
    description: 'Test coverage FR (C4) meets configured threshold',
    evaluate: (ctx) => {
      const val = ctx.coverage.C4;
      const threshold = getConfiguredGateThreshold(ctx.projectRoot, 'G-VERIFY-01');
      const uncovered = getUncoveredFrIds(ctx.rows, 'TC');
      return {
        pass: val >= threshold,
        detail:
          uncovered.length > 0
            ? `C4=${(val * 100).toFixed(1)}% target(${formatPercentThreshold(threshold, '=')}) uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
            : `C4=${(val * 100).toFixed(1)}% target(${formatPercentThreshold(threshold, '=')})`,
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
      const nonTerminal = ctx.rows.filter((r) => !TERMINAL_STATUSES.has(r.status));
      return {
        pass: nonTerminal.length === 0,
        detail:
          nonTerminal.length > 0
            ? `${nonTerminal.length} non-terminal: ${nonTerminal
                .slice(0, 3)
                .map((r) => r.id)
                .join(', ')}`
            : 'All terminal',
      };
    },
  },
];

// ─── 07_release 条件 ─────────────────────────────────────
GATE_CONDITIONS['07_release' as Stage] = RELEASE_REQUIRED_ARTIFACTS.map((relativePath, index) => ({
  id: index === 0 ? 'G-REL-01' : 'G-REL-02',
  description: relativePath.endsWith('release-note.md')
    ? 'Release note exists'
    : 'Smoke test report exists',
  evaluate: (ctx) => ({
    pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, relativePath)),
  }),
}));

// ─── 辅助函数 ─────────────────────────────────────────────

export function shouldSkipCondition(conditionId: string, projectType: string): boolean {
  if (projectType === 'css-only' || projectType === 'frontend') {
    return ['G-IMPL-01', 'G-VERIFY-01', 'PYTEST', 'DIFF-COV'].some((id) =>
      conditionId.includes(id)
    );
  }
  return false;
}

function evaluateSpecQualityScore(
  featureId: string,
  projectRoot: string
): { pass: boolean; detail: string } {
  const specDir = join(projectRoot, 'specs', featureId);
  const candidates = [
    join(specDir, 'checklists', 'spec-review.md'),
    join(specDir, 'spec-review.md'),
    join(specDir, 'checklist.md'),
  ];
  const source = candidates.find((filePath) => exists(filePath));
  if (!source) {
    return {
      pass: false,
      detail: 'C10 unavailable: missing checklists/spec-review.md',
    };
  }

  const content = readFileSync(source, 'utf-8');
  const totalChecks = (content.match(/^\s*[-*]\s*\[[ xX]\]\s+/gm) ?? []).length;
  const passedChecks = (content.match(/^\s*[-*]\s*\[[xX]\]\s+/gm) ?? []).length;

  if (totalChecks > 0) {
    const score = passedChecks / totalChecks;
    return {
      pass: score >= 0.8,
      detail: `C10=${(score * 100).toFixed(1)}% (${passedChecks}/${totalChecks}) source=${toFeatureRelativePath(featureId, projectRoot, source)}`,
    };
  }

  const explicitScore = parseExplicitPercent(content, 'C10');
  if (explicitScore !== undefined) {
    return {
      pass: explicitScore >= 0.8,
      detail: `C10=${(explicitScore * 100).toFixed(1)}% source=${toFeatureRelativePath(featureId, projectRoot, source)} (from explicit score)`,
    };
  }

  return {
    pass: false,
    detail: `C10 unavailable: no checklist items parsed in ${toFeatureRelativePath(featureId, projectRoot, source)}`,
  };
}

function evaluateAnalyzeCriticalFindings(
  featureId: string,
  projectRoot: string
): { pass: boolean; detail: string } {
  const reportPath = join(projectRoot, 'specs', featureId, 'reports', 'analysis-report.md');

  if (exists(reportPath)) {
    const mtime = statSync(reportPath).mtime;
    const age = Date.now() - mtime.getTime();
    if (age > 5 * 60 * 1000) {
      console.log('⚠️  分析报告过期，自动刷新...');
      analyzeArtifacts(featureId, projectRoot);
    }
  } else {
    return {
      pass: false,
      detail: 'Analyze report missing: run `spec-first analyze <featureId>` first',
    };
  }

  const content = readFileSync(reportPath, 'utf-8');
  const critical = getCriticalCountFromAnalysisReport(content);
  return {
    pass: critical === 0,
    detail: `Analyze CRITICAL=${critical} (source=reports/analysis-report.md)`,
  };
}

function parseExplicitPercent(content: string, metric: string): number | undefined {
  const pattern = new RegExp(`${escapeRegExp(metric)}\\s*[:=]\\s*(\\d+(?:\\.\\d+)?)\\s*%?`, 'i');
  const match = content.match(pattern);
  if (!match?.[1]) return undefined;
  const raw = Number.parseFloat(match[1]);
  if (Number.isNaN(raw)) return undefined;
  if (raw > 1) return raw / 100;
  return raw;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toFeatureRelativePath(
  featureId: string,
  projectRoot: string,
  absolutePath: string
): string {
  const prefix = `${join(projectRoot, 'specs', featureId)}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : absolutePath;
}

function getUncoveredFrIds(rows: MatrixRow[], downstreamType: IdType): string[] {
  const trace = createTraceContext(rows);
  if (trace.frRows.length === 0) return [];

  const covered = new Set<string>();
  if (downstreamType === 'TASK') {
    const coveredFrIds = trace.lineage.collectCoveredTargetIds(
      trace.rows.filter((row) => row.type === 'TASK').map((row) => row.id),
      trace.frIds
    );
    for (const frId of coveredFrIds) covered.add(frId);
  } else {
    const downstreamRows = rows.filter((r) => r.type === downstreamType);
    for (const row of downstreamRows) {
      for (const upstreamId of row.upstream ?? []) {
        covered.add(upstreamId);
      }
    }
  }

  return trace.frRows.filter((fr) => !covered.has(fr.id)).map((fr) => fr.id);
}
