/**
 * SCA — Specification Consistency Audit
 * 简化为文档级一致性检查：存在性、声明关系、正文引用、背景质量。
 */
import { join } from 'node:path';
import { Stage } from '../../shared/types.js';
import { exists, readJson, readMarkdown } from '../../shared/fs-utils.js';
import {
  documentMentionsPath,
  findBrokenDocumentReferences,
  listFeatureTextArtifacts,
  listMissingDocumentFiles,
  loadDocumentLinks,
  validateStageDocumentLinks,
} from '../document-links.js';
import { checkFirstDocsExistence } from '../skill-runtime/first-docs-check.js';
import { readFirstRuntimeIndex } from '../skill-runtime/first-runtime-store.js';

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

function collectBackgroundQualityFindings(
  featureId: string,
  projectRoot: string
): AnalyzeFinding[] {
  const findings: AnalyzeFinding[] = [];
  const featureDir = join(projectRoot, 'specs', featureId);
  const stageStatePath = join(featureDir, 'stage-state.json');

  if (exists(stageStatePath)) {
    try {
      const stageState = readJson<{ currentStage?: string; backgroundInputStatus?: string }>(
        stageStatePath
      );
      if (
        stageState.currentStage === '05_verify' &&
        stageState.backgroundInputStatus &&
        stageState.backgroundInputStatus !== 'full'
      ) {
        findings.push({
          severity: 'HIGH',
          type: 'BACKGROUND_INPUT_DEGRADED',
          location: 'stage-state.json',
          detail: `验证阶段 background_input_status=${stageState.backgroundInputStatus}`,
          suggestion: '补齐 verify-view / first runtime 背景后重新执行 analyze 与 verify',
        });
      } else if (!stageState.backgroundInputStatus) {
        findings.push({
          severity: 'MEDIUM',
          type: 'BACKGROUND_INPUT_MISSING',
          location: 'stage-state.json',
          detail: 'stage-state.json 缺少 background_input_status',
          suggestion: '执行 init / stage 同步，补齐 background_input_status 字段',
        });
      }
    } catch {
      findings.push({
        severity: 'MEDIUM',
        type: 'BACKGROUND_INPUT_INVALID',
        location: 'stage-state.json',
        detail: 'stage-state.json 解析失败，无法分析背景质量',
        suggestion: '修复 stage-state.json 格式后重新执行 analyze',
      });
    }
  }

  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  if (!runtimeIndex) {
    findings.push({
      severity: 'MEDIUM',
      type: 'FIRST_RUNTIME_MISSING',
      location: '.spec-first/runtime/first/index.json',
      detail: '缺少 first runtime index，无法判断 runtime 真源健康状态',
      suggestion: '先执行 /spec-first:first 生成 runtime 真源层',
    });
    return findings;
  }

  const requiredAssets = [
    runtimeIndex.summary,
    runtimeIndex.steering,
    runtimeIndex.conventions,
    runtimeIndex.criticalFlows,
    runtimeIndex.entryGuide,
    runtimeIndex.apiContracts,
    runtimeIndex.structureOverview,
    runtimeIndex.domainModel,
  ];

  if (requiredAssets.some((asset) => !asset.healthy) || runtimeIndex.databaseSchema.status === 'degraded') {
    findings.push({
      severity: 'MEDIUM',
      type: 'FIRST_RUNTIME_UNHEALTHY',
      location: '.spec-first/runtime/first/index.json',
      detail: `first runtime 健康状态异常: ${runtimeIndex.staleReason ?? 'unknown'}`,
      suggestion: '重新执行 /spec-first:first 修复 runtime 真源健康状态',
    });
  }

  const missingDocs = checkFirstDocsExistence(projectRoot).missing;
  if (missingDocs.length > 0) {
    findings.push({
      severity: 'MEDIUM',
      type: 'DOCS_OUTPUTS_MISSING',
      location: 'docs/first',
      detail: `docs 输出缺失: ${missingDocs.join(', ')}`,
      suggestion: '重新执行 /spec-first:first 补齐 docs/first 输出',
    });
  }

  return findings;
}

export function runSca(featureId: string, projectRoot: string, stage: Stage): ScaResult {
  const checks = getStageSca(stage, featureId, projectRoot);
  return {
    stage,
    pass: checks.every((check) => check.pass),
    checks,
  };
}

function getStageSca(stage: Stage, featureId: string, projectRoot: string): ScaCheckItem[] {
  switch (stage) {
    case '01_specify' as Stage:
      return checkSpecify(featureId, projectRoot);
    case '02_design' as Stage:
      return checkDesign(featureId, projectRoot);
    case '03_plan' as Stage:
      return checkPlan(featureId, projectRoot);
    case '04_implement' as Stage:
      return checkImplement(featureId, projectRoot);
    case '05_verify' as Stage:
      return checkVerify(featureId, projectRoot);
    default:
      return [{ rule: 'SCA-SKIP', pass: true, detail: `阶段 ${stage} 无 SCA 规则` }];
  }
}

function checkSpecify(featureId: string, projectRoot: string): ScaCheckItem[] {
  const checks: ScaCheckItem[] = [];
  const specPath = join(projectRoot, 'specs', featureId, 'spec.md');
  checks.push({
    rule: 'SCA-SPEC-01: spec.md 存在',
    pass: exists(specPath),
    detail: exists(specPath) ? 'spec.md 已存在' : '缺少 spec.md',
  });

  checks.push(stageDocCheck('SCA-SPEC-02: document-links 声明 spec.md', featureId, projectRoot, Stage.SPECIFY));
  return checks;
}

function checkDesign(featureId: string, projectRoot: string): ScaCheckItem[] {
  const designPath = join(projectRoot, 'specs', featureId, 'design.md');
  const specPath = join(projectRoot, 'specs', featureId, 'spec.md');

  return [
    {
      rule: 'SCA-DESIGN-01: design.md 存在',
      pass: exists(designPath),
      detail: exists(designPath) ? 'design.md 已存在' : '缺少 design.md',
    },
    stageDocCheck('SCA-DESIGN-02: document-links 声明 design -> spec', featureId, projectRoot, Stage.DESIGN),
    {
      rule: 'SCA-DESIGN-03: design.md 正文引用 spec.md',
      pass: exists(designPath) && exists(specPath) && documentMentionsPath(featureId, projectRoot, 'design.md', 'spec.md'),
      detail:
        exists(designPath) && exists(specPath) && documentMentionsPath(featureId, projectRoot, 'design.md', 'spec.md')
          ? 'design.md 已正文引用 spec.md'
          : 'design.md 未正文引用 spec.md',
    },
  ];
}

function checkPlan(featureId: string, projectRoot: string): ScaCheckItem[] {
  const taskPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  return [
    {
      rule: 'SCA-PLAN-01: task_plan.md 存在',
      pass: exists(taskPath),
      detail: exists(taskPath) ? 'task_plan.md 已存在' : '缺少 task_plan.md',
    },
    stageDocCheck('SCA-PLAN-02: document-links 声明 task -> spec/design', featureId, projectRoot, Stage.PLAN),
    {
      rule: 'SCA-PLAN-03: task_plan.md 正文引用 spec.md / design.md',
      pass:
        exists(taskPath) &&
        documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'spec.md') &&
        documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'design.md'),
      detail:
        exists(taskPath) &&
        documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'spec.md') &&
        documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'design.md')
          ? 'task_plan.md 已正文引用 spec.md 与 design.md'
          : 'task_plan.md 缺少对 spec.md 或 design.md 的正文引用',
    },
  ];
}

function checkImplement(featureId: string, projectRoot: string): ScaCheckItem[] {
  try {
    const links = loadDocumentLinks(featureId, projectRoot);
    const missing = listMissingDocumentFiles(links, featureId, projectRoot);
    return [
      {
        rule: 'SCA-IMPL-01: 已声明文档全部落盘',
        pass: missing.length === 0,
        detail: missing.length === 0 ? '全部声明文档已存在' : `缺失文档：${missing.join(', ')}`,
      },
    ];
  } catch (error) {
    return [
      {
        rule: 'SCA-IMPL-01: 已声明文档全部落盘',
        pass: false,
        detail: error instanceof Error ? error.message : String(error),
      },
    ];
  }
}

function checkVerify(featureId: string, projectRoot: string): ScaCheckItem[] {
  const reportPaths = ['reports/test-report.md', 'reports/security-scan.md'];
  const missing = reportPaths.filter((path) => !exists(join(projectRoot, 'specs', featureId, path)));
  return [
    {
      rule: 'SCA-VERIFY-01: 验证报告齐备',
      pass: missing.length === 0,
      detail: missing.length === 0 ? '验证报告齐备' : `缺失报告：${missing.join(', ')}`,
    },
  ];
}

export function analyzeArtifacts(featureId: string, projectRoot: string): AnalyzeResult {
  const featureDir = join(projectRoot, 'specs', featureId);
  const findings: AnalyzeFinding[] = [];
  const requiredArtifacts = ['prd.md', 'spec.md', 'design.md', 'task_plan.md', 'document-links.yaml'];

  for (const artifact of requiredArtifacts) {
    if (!exists(join(featureDir, artifact))) {
      findings.push({
        severity: 'CRITICAL',
        type: 'ARTIFACT_MISSING',
        location: artifact,
        detail: `缺少必需产物: ${artifact}`,
        suggestion: `补齐 ${artifact} 后重新执行 analyze`,
      });
    }
  }

  try {
    const links = loadDocumentLinks(featureId, projectRoot);
    const brokenRefs = findBrokenDocumentReferences(links);
    const missingDocs = listMissingDocumentFiles(links, featureId, projectRoot);

    if (links.documents.length === 0) {
      findings.push({
        severity: 'HIGH',
        type: 'DOCUMENT_LINKS_EMPTY',
        location: 'document-links.yaml',
        detail: 'document-links.yaml 未声明任何文档',
        suggestion: '至少声明 spec.md、design.md、task_plan.md 等主文档',
      });
    }

    if (brokenRefs.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'DOCUMENT_LINKS_BROKEN',
        location: 'document-links.yaml',
        detail: `存在失效关联：${brokenRefs.slice(0, 8).join(', ')}${brokenRefs.length > 8 ? ' ...' : ''}`,
        suggestion: '修复 document-links.yaml 中不存在的 references',
      });
    }

    if (missingDocs.length > 0) {
      findings.push({
        severity: 'HIGH',
        type: 'DOCUMENT_DECLARED_BUT_MISSING',
        location: 'document-links.yaml',
        detail: `已声明但未落盘：${missingDocs.join(', ')}`,
        suggestion: '补齐对应文档，或从 document-links.yaml 移除无效声明',
      });
    }

    if (exists(join(featureDir, 'design.md')) && !documentMentionsPath(featureId, projectRoot, 'design.md', 'spec.md')) {
      findings.push({
        severity: 'HIGH',
        type: 'DESIGN_REF_MISSING',
        location: 'design.md',
        detail: 'design.md 未正文引用 spec.md',
        suggestion: '在 design.md 中显式引用 spec.md',
      });
    }

    if (
      exists(join(featureDir, 'task_plan.md')) &&
      (!documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'spec.md') ||
        !documentMentionsPath(featureId, projectRoot, 'task_plan.md', 'design.md'))
    ) {
      findings.push({
        severity: 'HIGH',
        type: 'TASK_PLAN_REF_MISSING',
        location: 'task_plan.md',
        detail: 'task_plan.md 未完整正文引用 spec.md / design.md',
        suggestion: '在 task_plan.md 中显式引用 spec.md 与 design.md',
      });
    }
  } catch (error) {
    findings.push({
      severity: 'CRITICAL',
      type: 'DOCUMENT_LINKS_INVALID',
      location: 'document-links.yaml',
      detail: error instanceof Error ? error.message : String(error),
      suggestion: '修复 document-links.yaml 的结构与引用关系',
    });
  }

  const ambiguousTerms = ['适当', '合理', '尽快', '等等', '可能', '大概', 'as needed', 'etc', 'user-friendly'];
  for (const file of listFeatureTextArtifacts(featureId, projectRoot)) {
    if (!file.endsWith('.md')) continue;
    if (file.startsWith('reports/')) continue;
    const content = readMarkdown(join(featureDir, file));
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

  findings.push(...collectBackgroundQualityFindings(featureId, projectRoot));

  if (findings.length === 0) {
    findings.push({
      severity: 'LOW',
      type: 'NO_SIGNIFICANT_ISSUE',
      location: 'all',
      detail: '未发现显著一致性问题',
      suggestion: '可继续推进并在后续变更后复检',
    });
  }

  return {
    featureId,
    generatedAt: new Date().toISOString(),
    findings: sortFindings(findings),
    summary: summarizeFindings(findings),
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
    lines.push(
      `| ${finding.severity} | ${finding.type} | ${escapeCell(finding.location)} | ${escapeCell(finding.detail)} | ${escapeCell(finding.suggestion)} |`
    );
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

function stageDocCheck(rule: string, featureId: string, projectRoot: string, stage: Stage): ScaCheckItem {
  try {
    const links = loadDocumentLinks(featureId, projectRoot);
    const result = validateStageDocumentLinks(links, stage);
    return { rule, pass: result.pass, detail: result.detail };
  } catch (error) {
    return {
      rule,
      pass: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function summarizeFindings(findings: AnalyzeFinding[]): AnalyzeResult['summary'] {
  return {
    CRITICAL: findings.filter((finding) => finding.severity === 'CRITICAL').length,
    HIGH: findings.filter((finding) => finding.severity === 'HIGH').length,
    MEDIUM: findings.filter((finding) => finding.severity === 'MEDIUM').length,
    LOW: findings.filter((finding) => finding.severity === 'LOW').length,
    total: findings.length,
  };
}

function sortFindings(findings: AnalyzeFinding[]): AnalyzeFinding[] {
  const order: Record<AnalyzeSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return [...findings].sort((left, right) => {
    if (order[left.severity] !== order[right.severity]) {
      return order[left.severity] - order[right.severity];
    }
    if (left.type !== right.type) return left.type.localeCompare(right.type);
    return left.location.localeCompare(right.location);
  });
}

function escapeCell(input: string): string {
  return input.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
