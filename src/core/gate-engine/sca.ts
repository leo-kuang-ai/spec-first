/**
 * SCA — Specification Consistency Audit
 * 5阶段规范一致性检查：Specify→Design→Plan→Implement→Verify
 */
import { join } from 'node:path';
import type { Stage, MatrixRow } from '../../shared/types.js';
import { exists, readMarkdown } from '../../shared/fs-utils.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { createUpstreamLineage } from '../trace-engine/upstream-lineage.js';

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

export type AnalyzeSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AnalyzeFinding {
  severity: AnalyzeSeverity;
  type: string;
  location: string;
  detail: string;
  suggestion: string;
}

export interface AnalyzeResult {
  featureId: string;
  generatedAt: string;
  findings: AnalyzeFinding[];
  summary: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    total: number;
  };
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
    default: return [{ rule: 'SCA-SKIP', pass: true, detail: `阶段 ${stage} 无 SCA 规则` }];
  }
}

// ─── Specify 阶段 ────────────────────────────────────────

function checkSpecify(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');

  // PRD→FR 映射完整性
  const unmappedFr = frRows.filter(r =>
    !(r.upstream ?? []).some(u => u.startsWith('REQ-PRD-'))
  );
  checks.push({
    rule: 'SCA-SPEC-00: PRD→FR 映射完整性',
    pass: unmappedFr.length === 0,
    detail: unmappedFr.length > 0
      ? `未映射 PRD 的 FR：${unmappedFr.map(r => r.id).join(', ')}`
      : `${frRows.length} 个 FR 全部映射到 PRD`,
  });

  // FR ID 唯一性（NFR 暂未纳入 IdType，按 FR 检查）
  const ids = rows.filter(r => r.type === 'FR').map(r => r.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  checks.push({
    rule: 'SCA-SPEC-01: FR/NFR ID 唯一性',
    pass: dupes.length === 0,
    detail: dupes.length > 0 ? `重复 ID：${dupes.join(', ')}` : `${ids.length} 个唯一 ID`,
  });

  // 每个 FR 必须有 title
  const noTitle = frRows.filter(r => !r.title || r.title.trim() === '');
  checks.push({
    rule: 'SCA-SPEC-02: FR 标题完整性',
    pass: noTitle.length === 0,
    detail: noTitle.length > 0 ? `缺少标题：${noTitle.map(r => r.id).join(', ')}` : '全部 FR 均有标题',
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
    rule: 'SCA-DESIGN-01: FR→DS 映射完整性',
    pass: unmapped.length === 0,
    detail: unmapped.length > 0
      ? `未映射 FR：${unmapped.map(r => r.id).join(', ')}`
      : `${frRows.length} 个 FR 全部映射到 DS`,
  });

  return checks;
}

// ─── Plan 阶段 ───────────────────────────────────────────

function checkPlan(rows: MatrixRow[]): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const frRows = rows.filter(r => r.type === 'FR');
  const taskRows = rows.filter(r => r.type === 'TASK');
  const frIds = new Set(frRows.map((r) => r.id));
  const lineage = createUpstreamLineage(rows);
  const mappedFr = lineage.collectCoveredTargetIds(taskRows.map((task) => task.id), frIds);

  // 每个 FR 必须有对应 TASK
  const unmapped = frRows.filter(r => !mappedFr.has(r.id));
  checks.push({
    rule: 'SCA-PLAN-01: FR→TASK 映射完整性',
    pass: unmapped.length === 0,
    detail: unmapped.length > 0
      ? `未映射 FR：${unmapped.map(r => r.id).join(', ')}`
      : `${frRows.length} 个 FR 全部映射到 TASK`,
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
    rule: 'SCA-IMPL-01: TASK 实现完整性',
    pass: incomplete.length === 0,
    detail: incomplete.length > 0
      ? `未完成：${incomplete.map(r => `${r.id}(${r.status})`).join(', ')}`
      : `${taskRows.length} 个 TASK 全部实现`,
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
    rule: 'SCA-VERIFY-01: FR→TC 测试覆盖',
    pass: untested.length === 0,
    detail: untested.length > 0
      ? `未测试 FR：${untested.map(r => r.id).join(', ')}`
      : `${frRows.length} 个 FR 全部有 TC`,
  });

  return checks;
}

/** 跨产物一致性分析（只读） */
export function analyzeArtifacts(featureId: string, projectRoot: string): AnalyzeResult {
  const featureDir = join(projectRoot, 'specs', featureId);
  const findings: AnalyzeFinding[] = [];

  const requiredArtifacts = [
    { file: 'prd.md', label: 'prd' },
    { file: 'spec.md', label: 'spec' },
    { file: 'design.md', label: 'design' },
    { file: 'task_plan.md', label: 'task-plan' },
    { file: 'traceability-matrix.md', label: 'matrix' },
  ];

  for (const artifact of requiredArtifacts) {
    const fullPath = join(featureDir, artifact.file);
    if (!exists(fullPath)) {
      findings.push({
        severity: 'CRITICAL',
        type: 'ARTIFACT_MISSING',
        location: artifact.file,
        detail: `缺少必需产物: ${artifact.file}`,
        suggestion: `补齐 ${artifact.file} 后重新执行 analyze`,
      });
    }
  }

  const rows = parseMatrix(featureId, projectRoot);
  const frRows = rows.filter((r) => r.type === 'FR');
  if (rows.length === 0) {
    findings.push({
      severity: 'HIGH',
      type: 'TRACEABILITY_EMPTY',
      location: 'traceability-matrix.md',
      detail: '追踪矩阵为空，无法完成跨产物一致性分析',
      suggestion: '先补齐 FR/DS/TASK/TC 基础行',
    });
  } else if (frRows.length > 0) {
    const unmappedPrd = frRows.filter((r) =>
      !(r.upstream ?? []).some((u) => u.startsWith('REQ-PRD-'))
    ).map((r) => r.id);
    if (unmappedPrd.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'COVERAGE_GAP_PRD',
        location: 'traceability-matrix.md',
        detail: `FR 未映射 PRD: ${unmappedPrd.slice(0, 8).join(', ')}${unmappedPrd.length > 8 ? ' ...' : ''}`,
        suggestion: '每个 FR 至少需要 1 条 REQ-PRD-* upstream 引用',
      });
    }

    const dsUpstream = new Set(rows.filter((r) => r.type === 'DS').flatMap((r) => r.upstream ?? []));
    const lineage = createUpstreamLineage(rows);
    const frIds = new Set(frRows.map((r) => r.id));
    const taskMappedFr = lineage.collectCoveredTargetIds(
      rows.filter((r) => r.type === 'TASK').map((task) => task.id),
      frIds,
    );

    const uncoveredByDs = frRows.filter((r) => !dsUpstream.has(r.id)).map((r) => r.id);
    if (uncoveredByDs.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'COVERAGE_GAP_DS',
        location: 'traceability-matrix.md',
        detail: `FR 未被 DS 覆盖: ${uncoveredByDs.slice(0, 8).join(', ')}${uncoveredByDs.length > 8 ? ' ...' : ''}`,
        suggestion: '补充 DS 条目并建立 upstream 关联',
      });
    }

    const uncoveredByTask = frRows.filter((r) => !taskMappedFr.has(r.id)).map((r) => r.id);
    if (uncoveredByTask.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'COVERAGE_GAP_TASK',
        location: 'traceability-matrix.md',
        detail: `FR 未被 TASK 覆盖: ${uncoveredByTask.slice(0, 8).join(', ')}${uncoveredByTask.length > 8 ? ' ...' : ''}`,
        suggestion: '补充 TASK 条目并建立 upstream 关联',
      });
    }
  }

  const ambiguousTerms = ['适当', '合理', '尽快', '等等', '可能', '大概', 'as needed', 'etc', 'user-friendly'];
  for (const file of ['spec.md', 'design.md', 'task_plan.md']) {
    const fullPath = join(featureDir, file);
    if (!exists(fullPath)) continue;
    const content = readMarkdown(fullPath);
    const hits = ambiguousTerms.filter((term) => content.toLowerCase().includes(term.toLowerCase()));
    if (hits.length === 0) continue;
    findings.push({
      severity: 'MEDIUM',
      type: 'AMBIGUOUS_LANGUAGE',
      location: file,
      detail: `检测到模糊词汇: ${hits.slice(0, 6).join(', ')}${hits.length > 6 ? ' ...' : ''}`,
      suggestion: '将模糊描述改为可验证的量化标准',
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'LOW',
      type: 'NO_SIGNIFICANT_ISSUE',
      location: 'all',
      detail: '未发现显著一致性问题',
      suggestion: '可继续推进并在后续变更后复检',
    });
  }

  const summary = summarizeFindings(findings);
  return {
    featureId,
    generatedAt: new Date().toISOString(),
    findings: sortFindings(findings),
    summary,
  };
}

export function renderAnalysisReport(result: AnalyzeResult): string {
  const lines: string[] = [];
  lines.push(`# Analysis Report — ${result.featureId}`);
  lines.push('');
  lines.push(`> Generated At: ${result.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- CRITICAL: ${result.summary.CRITICAL}`);
  lines.push(`- HIGH: ${result.summary.HIGH}`);
  lines.push(`- MEDIUM: ${result.summary.MEDIUM}`);
  lines.push(`- LOW: ${result.summary.LOW}`);
  lines.push(`- Total: ${result.summary.total}`);
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  lines.push('| Severity | Type | Location | Detail | Suggestion |');
  lines.push('|----------|------|----------|--------|------------|');
  for (const finding of result.findings) {
    lines.push(`| ${finding.severity} | ${finding.type} | ${escapeCell(finding.location)} | ${escapeCell(finding.detail)} | ${escapeCell(finding.suggestion)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

export function getCriticalCountFromAnalysisReport(content: string): number {
  const summaryMatch = content.match(/-+\s*CRITICAL\s*:\s*(\d+)/i);
  if (summaryMatch?.[1]) {
    return Number.parseInt(summaryMatch[1], 10) || 0;
  }
  const tableMatch = content.match(/\|\s*CRITICAL\s*\|\s*(\d+)\s*\|/i);
  if (tableMatch?.[1]) {
    return Number.parseInt(tableMatch[1], 10) || 0;
  }
  const rowCount = content.split('\n').filter((line) => /\|\s*CRITICAL\s*\|/i.test(line)).length;
  return rowCount;
}

function summarizeFindings(findings: AnalyzeFinding[]): AnalyzeResult['summary'] {
  const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, total: findings.length };
  for (const finding of findings) {
    summary[finding.severity] += 1;
  }
  return summary;
}

function sortFindings(findings: AnalyzeFinding[]): AnalyzeFinding[] {
  const priority: Record<AnalyzeSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return [...findings].sort((a, b) => priority[a.severity] - priority[b.severity]);
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
