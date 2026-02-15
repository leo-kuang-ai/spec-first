/**
 * SCA — Specification Consistency Audit
 * 5阶段规范一致性检查：Specify→Design→Plan→Implement→Verify
 */
import type { Stage, MatrixRow, IdType } from '../../shared/types.js';
import { parseMatrix } from '../trace-engine/matrix.js';

export interface ScaCheckItem {
  rule: string;
  pass: boolean;
  detail?: string;
}

export interface ScaResult {
  stage: Stage;
  pass: boolean;
  checks: ScaCheckItem[];
}

/** 执行当前阶段的 SCA 检查 */
export function runSca(featureId: string, projectRoot: string, stage: Stage): ScaResult {
  const rows = parseMatrix(featureId, projectRoot);
  const checks = getStageSca(stage, rows);
  return {
    stage,
    pass: checks.every(c => c.pass),
    checks,
  };
}

function getStageSca(stage: Stage, rows: MatrixRow[]): ScaCheckItem[] {
  switch (stage) {
    case '01_specify' as Stage: return checkSpecify(rows);
    case '02_design' as Stage: return checkDesign(rows);
    case '03_plan' as Stage: return checkPlan(rows);
    case '04_implement' as Stage: return checkImplement(rows);
    case '05_verify' as Stage: return checkVerify(rows);
    default: return [{ rule: 'SCA-SKIP', pass: true, detail: `No SCA rules for stage ${stage}` }];
  }
}

// ─── Specify 阶段 ────────────────────────────────────────

function checkSpecify(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');

  // FR ID 唯一性（NFR 暂未纳入 IdType，按 FR 检查）
  const ids = rows.filter(r => r.type === 'FR').map(r => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  checks.push({
    rule: 'SCA-SPEC-01: FR/NFR ID uniqueness',
    pass: dupes.length === 0,
    detail: dupes.length > 0 ? `Duplicates: ${dupes.join(', ')}` : `${ids.length} unique IDs`,
  });

  // 每个 FR 必须有 title
  const noTitle = frRows.filter(r => !r.title || r.title.trim() === '');
  checks.push({
    rule: 'SCA-SPEC-02: FR title completeness',
    pass: noTitle.length === 0,
    detail: noTitle.length > 0 ? `Missing title: ${noTitle.map(r => r.id).join(', ')}` : 'All FRs have titles',
  });

  return checks;
}

// ─── Design 阶段 ─────────────────────────────────────────

function checkDesign(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');
  const dsRows = rows.filter(r => r.type === 'DS');
  const dsUpstreams = new Set(dsRows.flatMap(r => r.upstream ?? []));

  // 每个 FR 必须有对应 DS
  const unmapped = frRows.filter(r => !dsUpstreams.has(r.id));
  checks.push({
    rule: 'SCA-DESIGN-01: FR→DS mapping completeness',
    pass: unmapped.length === 0,
    detail: unmapped.length > 0
      ? `Unmapped FRs: ${unmapped.map(r => r.id).join(', ')}`
      : `${frRows.length} FRs all mapped to DS`,
  });

  return checks;
}

// ─── Plan 阶段 ───────────────────────────────────────────

function checkPlan(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');
  const taskRows = rows.filter(r => r.type === 'TASK');
  const taskUpstreams = new Set(taskRows.flatMap(r => r.upstream ?? []));

  // 每个 FR 必须有对应 TASK
  const unmapped = frRows.filter(r => !taskUpstreams.has(r.id));
  checks.push({
    rule: 'SCA-PLAN-01: FR→TASK mapping completeness',
    pass: unmapped.length === 0,
    detail: unmapped.length > 0
      ? `Unmapped FRs: ${unmapped.map(r => r.id).join(', ')}`
      : `${frRows.length} FRs all mapped to TASKs`,
  });

  return checks;
}

// ─── Implement 阶段 ──────────────────────────────────────

function checkImplement(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const taskRows = rows.filter(r => r.type === 'TASK');

  // TASK 必须有 Implemented 或更高状态
  const implemented = new Set(['Implemented', 'Verified', 'Accepted']);
  const incomplete = taskRows.filter(r => !implemented.has(r.status));
  checks.push({
    rule: 'SCA-IMPL-01: TASK implementation completeness',
    pass: incomplete.length === 0,
    detail: incomplete.length > 0
      ? `Incomplete: ${incomplete.map(r => `${r.id}(${r.status})`).join(', ')}`
      : `${taskRows.length} TASKs all implemented`,
  });

  return checks;
}

// ─── Verify 阶段 ─────────────────────────────────────────

function checkVerify(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');
  const tcRows = rows.filter(r => r.type === 'TC');
  const tcUpstreams = new Set(tcRows.flatMap(r => r.upstream ?? []));

  // 每个 FR 必须有对应 TC
  const untested = frRows.filter(r => !tcUpstreams.has(r.id));
  checks.push({
    rule: 'SCA-VERIFY-01: FR→TC test coverage',
    pass: untested.length === 0,
    detail: untested.length > 0
      ? `Untested FRs: ${untested.map(r => r.id).join(', ')}`
      : `${frRows.length} FRs all have TCs`,
  });

  return checks;
}
