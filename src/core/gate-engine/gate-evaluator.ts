/**
 * Gate 条件评估引擎
 * 读取 stage-state → 评估当前阶段 Gate 条件 → 检查豁免 → 输出三态结果
 */
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import type {
  Stage, GateStatus, GateResult, ConditionResult, WaiverRef,
  CoverageMetrics, StageState, IdType, MatrixRow,
} from '../../shared/types.js';
import { readJsonChecked, appendJsonl, exists } from '../../shared/fs-utils.js';
import { isStageState } from '../../shared/validators.js';
import { getCoverage } from '../trace-engine/coverage.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { createTraceContext } from '../trace-engine/trace-context.js';
import { validateExceptions } from '../trace-engine/exception-validator.js';
import { getCriticalCountFromAnalysisReport, analyzeArtifacts } from './sca.js';
import { runCommandGate } from './command-gate.js';
import { loadRfcStatuses } from '../change-mgr/rfc.js';
import { validatePrd } from './prd-validator.js';
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';

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
  rows: MatrixRow[];
  rfcStatuses: Map<string, string>;
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
    id: 'G-SPEC-00',
    description: 'PRD exists and C-PRD ≥ 85%',
    evaluate: (ctx) => {
      const prdPath = join(ctx.projectRoot, 'specs', ctx.featureId, 'prd.md');
      if (!exists(prdPath)) {
        return { pass: false, detail: 'prd.md not found' };
      }
      const result = validatePrd(prdPath);
      return {
        pass: result.valid && result.score >= 85,
        detail: `C-PRD=${result.score}% errors=${result.errors.length}`,
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
      const frCount = ctx.rows.filter(r => r.type === 'FR').length;
      return { pass: frCount > 0, detail: `FR count: ${frCount}` };
    },
  },
  {
    id: 'G-SPEC-03',
    description: 'Spec quality score (C10) ≥ 80%',
    evaluate: (ctx) => {
      const c10 = evaluateSpecQualityScore(ctx.featureId, ctx.projectRoot);
      return { pass: c10.pass, detail: c10.detail };
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
      const uncovered = getUncoveredFrIds(ctx.rows, 'DS');
      return {
        pass: val >= 1.0,
        detail: uncovered.length > 0
          ? `C2=${(val * 100).toFixed(1)}% uncovered FR: ${uncovered.slice(0, 5).join(', ')}`
          : `C2=${(val * 100).toFixed(1)}%`,
        scopeFrIds: uncovered,
      };
    },
  },
  {
    id: 'G-DESIGN-03',
    description: 'Constitution compliance (C11)',
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
    description: 'Unit test coverage (C4) ≥ 80%',
    evaluate: (ctx) => {
      const val = ctx.coverage.C4;
      const uncovered = getUncoveredFrIds(ctx.rows, 'TC');
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
      const uncovered = getUncoveredFrIds(ctx.rows, 'TC');
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
      const uncovered = getUncoveredFrIds(ctx.rows, 'TC');
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
      const terminal = new Set(['Accepted', 'Cancelled', 'Exception']);
      const nonTerminal = ctx.rows.filter(r => !terminal.has(r.status));
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
GATE_CONDITIONS['07_release' as Stage] = RELEASE_REQUIRED_ARTIFACTS.map((relativePath, index) => ({
  id: index === 0 ? 'G-REL-01' : 'G-REL-02',
  description: relativePath.endsWith('release-note.md') ? 'Release note exists' : 'Smoke test report exists',
  evaluate: (ctx) => ({
    pass: exists(join(ctx.projectRoot, 'specs', ctx.featureId, relativePath)),
  }),
}));

// ─── 核心评估函数 ─────────────────────────────────────────

function getProjectTypeFromConstitution(featureId: string, projectRoot: string): string {
  try {
    const constitutionPath = join(projectRoot, 'specs', featureId, 'constitution.md');
    const content = readFileSync(constitutionPath, 'utf-8');
    const match = /项目类型[*\s]*[:：]\s*(\S+)/i.exec(content);
    return match?.[1] || 'fullstack';
  } catch {
    return 'fullstack';
  }
}

function shouldSkipCondition(conditionId: string, projectType: string): boolean {
  if (projectType === 'css-only' || projectType === 'frontend') {
    return ['C4', 'C5', 'PYTEST', 'DIFF-COV'].some(id => conditionId.includes(id));
  }
  return false;
}

/** 获取指定阶段的 Gate 条件定义 */
export function getConditions(stage: Stage, projectType?: string): GateConditionDef[] {
  const conditions = GATE_CONDITIONS[stage] ?? [];
  if (!projectType) return conditions;
  return conditions.filter(c => !shouldSkipCondition(c.id, projectType));
}

/** 评估 Gate：条件检查 + 豁免匹配 → 三态结果 */
export interface EvaluateGateOptions {
  persist?: boolean;
}

export function evaluateGate(featureId: string, projectRoot: string, options: EvaluateGateOptions = {}): GateResult {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  const state = readJsonChecked(statePath, isStageState);
  const stage = state.currentStage;

  // 构建评估上下文（一次解析，全程复用）
  const rows = parseMatrix(featureId, projectRoot);
  const rfcStatuses = loadRfcStatuses(featureId, projectRoot);
  const coverage = getCoverage(featureId, projectRoot, rows, rfcStatuses);
  const ctx: EvalContext = { featureId, projectRoot, stage, state, coverage, rows, rfcStatuses };

  const projectType = getProjectTypeFromConstitution(featureId, projectRoot);
  const defs = getConditions(stage, projectType);
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

  // Layer2 命令 Gate：从 mergedRules.gateConditions 读取带 command 的条件并执行
  const l2Conditions = (state.mergedRules?.gateConditions?.[stage] ?? []) as Array<{
    id: string; description: string; command?: string;
  }>;
  const evaluatedIds = new Set(conditions.map(c => c.id));
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

  // 检查豁免：将 FAIL 条件与 valid exceptions 匹配
  const waivers: WaiverRef[] = [];
  const failedIds = conditions.filter(c => c.status === 'FAIL').map(c => c.id);

  if (failedIds.length > 0) {
    const { valid } = validateExceptions(featureId, projectRoot, ctx.rfcStatuses);

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

function evaluateSpecQualityScore(featureId: string, projectRoot: string): { pass: boolean; detail: string } {
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

function evaluateConstitutionCompliance(featureId: string, projectRoot: string): { pass: boolean; detail: string } {
  const constitutionPath = join(projectRoot, 'specs', featureId, 'constitution.md');
  if (!exists(constitutionPath)) {
    return {
      pass: false,
      detail: `C11 FAIL: constitution.md missing; fix: create specs/${featureId}/constitution.md with Version/Ratified/Last Amended/Amendment History`,
    };
  }

  const designPath = join(projectRoot, 'specs', featureId, 'design.md');
  if (!exists(designPath)) {
    return {
      pass: false,
      detail: `C11 FAIL: design.md missing; fix: create specs/${featureId}/design.md and add Constitution Clause references`,
    };
  }

  const constitution = readFileSync(constitutionPath, 'utf-8');
  const design = readFileSync(designPath, 'utf-8');

  const meta = parseConstitutionMeta(constitution);
  const failures: string[] = [];

  if (!meta.version) {
    failures.push('missing version');
  } else if (!/^\d+\.\d+\.\d+$/.test(meta.version.replace(/^v/i, ''))) {
    failures.push(`invalid version (${meta.version})`);
  }
  if (!meta.ratified) failures.push('missing ratified date');
  if (!meta.lastAmended) failures.push('missing last_amended date');
  if (!meta.hasAmendmentHistory) failures.push('missing amendment history section');
  if (!hasConstitutionReference(design, meta.version)) {
    failures.push('design.md missing constitution clause reference');
  }

  const mainCopy = evaluateConstitutionMainCopyConsistency(projectRoot, constitution, meta);
  if (!mainCopy.pass) {
    failures.push(...mainCopy.failures);
  }

  const authorityMapping = evaluateConstitutionAuthorityMapping(projectRoot);
  if (!authorityMapping.pass) {
    failures.push(...authorityMapping.failures);
  }

  if (failures.length > 0) {
    const fixes = getC11FailureFixHints(featureId, failures);
    return {
      pass: false,
      detail: `C11 FAIL: ${failures.join('; ')}; fix: ${fixes.join(' | ')}`,
    };
  }

  return {
    pass: true,
    detail: `C11 PASS: version=${meta.version}, ratified=${meta.ratified}, last_amended=${meta.lastAmended}, authority_mapping=ok`,
  };
}

function evaluateConstitutionAuthorityMapping(projectRoot: string): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  const authorityRefPath = join(projectRoot, 'skills', 'spec-first', '03-spec', 'references', 'constitution-authority.md');
  const specSkillPath = join(projectRoot, 'skills', 'spec-first', '03-spec', 'SKILL.md');
  const designSkillPath = join(projectRoot, 'skills', 'spec-first', '04-design', 'SKILL.md');
  const codeReviewSkillPath = join(projectRoot, 'skills', 'spec-first', '08-review', 'SKILL.md');

  if (!exists(authorityRefPath)) {
    failures.push('constitution-authority.md missing');
  } else {
    const authorityRef = readFileSync(authorityRefPath, 'utf-8');
    const hasLevels = /Level\s*0[\s\S]*Level\s*1[\s\S]*Level\s*2[\s\S]*Level\s*3/i.test(authorityRef);
    const hasArbitrationRule = /(任意与\s*Constitution\s*冲突|any.*Constitution.*conflict)/i.test(authorityRef);
    if (!hasLevels) failures.push('constitution-authority.md missing Level 0-3 hierarchy');
    if (!hasArbitrationRule) failures.push('constitution-authority.md missing conflict arbitration rule');
  }

  if (!exists(specSkillPath)) {
    failures.push('03-spec/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(specSkillPath, 'utf-8'))) {
    failures.push('03-spec/SKILL.md missing constitution-authority reference');
  }

  if (!exists(designSkillPath)) {
    failures.push('04-design/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(designSkillPath, 'utf-8'))) {
    failures.push('04-design/SKILL.md missing constitution-authority reference');
  }

  if (!exists(codeReviewSkillPath)) {
    failures.push('08-review/SKILL.md missing');
  } else if (!/constitution-authority\.md/i.test(readFileSync(codeReviewSkillPath, 'utf-8'))) {
    failures.push('08-review/SKILL.md missing constitution-authority reference');
  }

  return { pass: failures.length === 0, failures };
}

function getC11FailureFixHints(featureId: string, failures: string[]): string[] {
  const hints: string[] = [];
  const push = (hint: string) => {
    if (!hints.includes(hint)) hints.push(hint);
  };

  for (const failure of failures) {
    if (failure === 'missing version' || failure.startsWith('invalid version')) {
      push(`specs/${featureId}/constitution.md: set semantic Version (e.g. 1.0.0)`);
      continue;
    }
    if (failure === 'missing ratified date') {
      push(`specs/${featureId}/constitution.md: add Ratified date (YYYY-MM-DD)`);
      continue;
    }
    if (failure === 'missing last_amended date') {
      push(`specs/${featureId}/constitution.md: add Last Amended date (YYYY-MM-DD)`);
      continue;
    }
    if (failure === 'missing amendment history section') {
      push(`specs/${featureId}/constitution.md: add '## Amendment History' section`);
      continue;
    }
    if (failure === 'design.md missing constitution clause reference') {
      push(`specs/${featureId}/design.md: add 'Constitution Clause <id> (v<version>)' references`);
      continue;
    }
    if (failure === 'global constitution missing version') {
      push('.spec-first/constitution.md: set semantic Version (e.g. 1.1.0)');
      continue;
    }
    if (failure.startsWith('global constitution version mismatch')) {
      push(`specs/${featureId}/constitution.md: sync Version with .spec-first/constitution.md or add explicit override reason`);
      continue;
    }
    if (failure.startsWith('global constitution content mismatch')) {
      push(`specs/${featureId}/constitution.md: sync content with .spec-first/constitution.md or add explicit override reason`);
      continue;
    }
    if (failure === 'constitution-authority.md missing') {
      push('skills/spec-first/03-spec/references/constitution-authority.md: create authority mapping doc');
      continue;
    }
    if (failure === 'constitution-authority.md missing Level 0-3 hierarchy') {
      push('skills/spec-first/03-spec/references/constitution-authority.md: add Level 0-3 hierarchy');
      continue;
    }
    if (failure === 'constitution-authority.md missing conflict arbitration rule') {
      push('skills/spec-first/03-spec/references/constitution-authority.md: add conflict arbitration rule');
      continue;
    }
    if (failure === '03-spec/SKILL.md missing') {
      push('skills/spec-first/03-spec/SKILL.md: restore skill doc and reference constitution-authority.md');
      continue;
    }
    if (failure === '03-spec/SKILL.md missing constitution-authority reference') {
      push('skills/spec-first/03-spec/SKILL.md: add reference to references/constitution-authority.md');
      continue;
    }
    if (failure === '04-design/SKILL.md missing') {
      push('skills/spec-first/04-design/SKILL.md: restore skill doc and reference constitution-authority.md');
      continue;
    }
    if (failure === '04-design/SKILL.md missing constitution-authority reference') {
      push('skills/spec-first/04-design/SKILL.md: add reference to ../03-spec/references/constitution-authority.md');
      continue;
    }
    if (failure === '08-review/SKILL.md missing') {
      push('skills/spec-first/08-review/SKILL.md: restore skill doc and reference constitution-authority.md');
      continue;
    }
    if (failure === '08-review/SKILL.md missing constitution-authority reference') {
      push('skills/spec-first/08-review/SKILL.md: add reference to ../03-spec/references/constitution-authority.md');
      continue;
    }
    push(`manual check required for: ${failure}`);
  }

  return hints.length > 0 ? hints : ['manual check required'];
}

function evaluateAnalyzeCriticalFindings(featureId: string, projectRoot: string): { pass: boolean; detail: string } {
  const reportPath = join(projectRoot, 'specs', featureId, 'reports', 'analysis-report.md');

  // 检查报告是否过期（5分钟）
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

function parseConstitutionMeta(content: string): {
  version?: string;
  ratified?: string;
  lastAmended?: string;
  hasAmendmentHistory: boolean;
} {
  const versionMatch = content.match(/(?:\*\*)?\s*(?:version|版本)\s*(?:\*\*)?\s*[:：]\s*([vV]?\d+\.\d+\.\d+)/i);
  const dateOrDateTime = '(\\d{4}-\\d{2}-\\d{2}(?:[T\\s]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?)?)';
  const ratifiedMatch = content.match(new RegExp(
    `(?:\\*\\*)?\\s*(?:ratified|批准日期|通过日期|生效日期)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
    'i',
  ));
  const amendedMatch = content.match(new RegExp(
    `(?:\\*\\*)?\\s*(?:last[_\\s-]*amended|最近修订|最后修订)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
    'i',
  ));
  const hasAmendmentHistory = /(?:^|\n)##\s*(amendment history|修订历史)\b/i.test(content)
    || /(?:amendment history|修订历史)/i.test(content);
  return {
    version: versionMatch?.[1],
    ratified: ratifiedMatch?.[1],
    lastAmended: amendedMatch?.[1],
    hasAmendmentHistory,
  };
}

function evaluateConstitutionMainCopyConsistency(
  projectRoot: string,
  featureConstitution: string,
  featureMeta: { version?: string },
): { pass: boolean; failures: string[] } {
  const globalPath = join(projectRoot, '.spec-first', 'constitution.md');
  if (!exists(globalPath)) return { pass: true, failures: [] };

  const globalContent = readFileSync(globalPath, 'utf-8');
  const globalMeta = parseConstitutionMeta(globalContent);
  const failures: string[] = [];

  if (!globalMeta.version) {
    failures.push('global constitution missing version');
    return { pass: false, failures };
  }

  const globalVersion = normalizeSemver(globalMeta.version);
  const featureVersion = normalizeSemver(featureMeta.version);
  if (!globalVersion || !featureVersion) return { pass: failures.length === 0, failures };

  const hasOverrideReason = hasConstitutionOverrideReason(featureConstitution);

  if (globalVersion !== featureVersion) {
    if (!hasOverrideReason) {
      failures.push(`global constitution version mismatch (global=${globalVersion}, feature=${featureVersion})`);
    }
  }

  const globalHash = hashNormalizedConstitution(globalContent);
  const featureHash = hashNormalizedConstitution(featureConstitution);
  if (globalHash !== featureHash && !hasOverrideReason) {
    failures.push(`global constitution content mismatch (global_sha256=${globalHash}, feature_sha256=${featureHash})`);
  }

  return { pass: failures.length === 0, failures };
}

function normalizeSemver(version?: string): string | undefined {
  return version?.trim().replace(/^v/i, '');
}

function hasConstitutionOverrideReason(content: string): boolean {
  return /(feature\s*override|特例覆盖|覆盖原因|override\s*reason)/i.test(content);
}

function hashNormalizedConstitution(content: string): string {
  const normalized = content
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}

function hasConstitutionReference(designContent: string, version?: string): boolean {
  const lines = designContent.split('\n');
  const hasClauseStyleRef = lines.some((line) =>
    /(constitution|宪法)/i.test(line)
    && /(clause|条款|principle|原则|version|版本|v\d+\.\d+\.\d+)/i.test(line),
  );
  if (hasClauseStyleRef) return true;

  if (version) {
    const normalized = version.replace(/^v/i, '');
    const byVersion = new RegExp(`(constitution|宪法)[^\\n]{0,48}(v)?${escapeRegExp(normalized)}`, 'i');
    if (byVersion.test(designContent)) return true;
  }

  return false;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function toFeatureRelativePath(featureId: string, projectRoot: string, absolutePath: string): string {
  const prefix = `${join(projectRoot, 'specs', featureId)}/`;
  return absolutePath.startsWith(prefix) ? absolutePath.slice(prefix.length) : absolutePath;
}

function getUncoveredFrIds(
  rows: MatrixRow[],
  downstreamType: IdType,
): string[] {
  const trace = createTraceContext(rows);
  if (trace.frRows.length === 0) return [];

  const covered = new Set<string>();
  if (downstreamType === 'TASK') {
    const coveredFrIds = trace.lineage.collectCoveredTargetIds(
      trace.rows.filter((row) => row.type === 'TASK').map((row) => row.id),
      trace.frIds,
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
