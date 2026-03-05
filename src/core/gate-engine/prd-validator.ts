/**
 * PRD 校验与评分
 * 章节完整性 + 场景校验 + C-PRD 评分
 */
import { readMarkdown } from '../../shared/fs-utils.js';

// ─── 类型 ────────────────────────────────────────────────

export interface PrdMetadata {
  scenario?: string;
  scenario_reason?: string;
  evidence_paths?: string[];
  complexity?: string;
  created_at?: string;
  last_updated?: string;
}

export interface PrdValidationResult {
  valid: boolean;
  score: number; // C-PRD 评分 0-100
  errors: string[];
  _warnings: string[];
  metadata: PrdMetadata;
}

// ─── 必需章节 ────────────────────────────────────────────

const REQUIRED_SECTIONS = [
  '## 1. 业务目标',
  '## 2. 功能边界',
  '## 3. 约束条件',
  '## 4. 成功标准',
];

const GREENFIELD_SECTIONS = [
  '### 1.1 问题陈述',
  '### 1.2 业务价值',
  '### 2.1 范围内',
  '### 2.2 范围外',
];

const ITERATION_SECTIONS = [
  '### 1.1 当前问题',
  '### 1.2 改进目标',
  '### 2.1 变更范围',
  '### 2.2 影响分析',
];

// ─── 元信息解析 ──────────────────────────────────────────

function parseMetadata(content: string): PrdMetadata {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const meta: PrdMetadata = {};

  const scenarioMatch = yaml.match(/scenario:\s*"([^"]*)"/);
  if (scenarioMatch) meta.scenario = scenarioMatch[1];

  const reasonMatch = yaml.match(/scenario_reason:\s*"([^"]*)"/);
  if (reasonMatch) meta.scenario_reason = reasonMatch[1];

  const pathsMatch = yaml.match(/evidence_paths:\s*\[(.*?)\]/);
  if (pathsMatch) {
    meta.evidence_paths = pathsMatch[1]
      .split(',')
      .map(p => p.trim().replace(/"/g, ''))
      .filter(Boolean);
  }

  const complexityMatch = yaml.match(/complexity:\s*"([^"]*)"/);
  if (complexityMatch) meta.complexity = complexityMatch[1];

  const createdMatch = yaml.match(/created_at:\s*"([^"]*)"/);
  if (createdMatch) meta.created_at = createdMatch[1];

  const updatedMatch = yaml.match(/last_updated:\s*"([^"]*)"/);
  if (updatedMatch) meta.last_updated = updatedMatch[1];

  return meta;
}

// ─── 章节完整性检查 ──────────────────────────────────────

function checkSections(content: string, meta: PrdMetadata): { errors: string[]; _warnings: string[] } {
  const errors: string[] = [];
  const _warnings: string[] = [];

  // 必需章节
  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`缺少必需章节：${section}`);
    }
  }

  // 场景特定章节
  if (meta.scenario === 'greenfield') {
    for (const section of GREENFIELD_SECTIONS) {
      if (!content.includes(section)) {
        _warnings.push(`Greenfield 场景建议包含：${section}`);
      }
    }
  } else if (meta.scenario === 'iteration') {
    for (const section of ITERATION_SECTIONS) {
      if (!content.includes(section)) {
        _warnings.push(`Iteration 场景建议包含：${section}`);
      }
    }
  }

  return { errors, _warnings };
}

// ─── 场景校验 ────────────────────────────────────────────

function validateScenario(meta: PrdMetadata): string[] {
  const errors: string[] = [];

  if (!meta.scenario || meta.scenario === '待判定') {
    errors.push('scenario 未判定');
  } else if (meta.scenario !== 'greenfield' && meta.scenario !== 'iteration') {
    errors.push(`scenario 取值无效：${meta.scenario}（应为 greenfield 或 iteration）`);
  }

  if (meta.scenario && meta.scenario !== '待判定' && !meta.scenario_reason) {
    errors.push('scenario_reason 为空');
  }

  if (!meta.evidence_paths || meta.evidence_paths.length === 0) {
    errors.push('evidence_paths 为空');
  }

  if (!meta.complexity || meta.complexity === '待判定') {
    errors.push('complexity 未判定');
  }

  return errors;
}

// ─── C-PRD 评分 ──────────────────────────────────────────

function calculateScore(content: string, meta: PrdMetadata, errors: string[], _warnings: string[]): number {
  let score = 100;

  // 元信息完整性 (30%)
  if (!meta.scenario || meta.scenario === '待判定') score -= 10;
  if (!meta.scenario_reason) score -= 5;
  if (!meta.evidence_paths || meta.evidence_paths.length === 0) score -= 10;
  if (!meta.complexity || meta.complexity === '待判定') score -= 5;

  // 章节完整性 (40%)
  score -= errors.length * 10;

  // 内容充实度 (30%)
  const placeholderCount = (content.match(/\[.*?\]/g) || []).length;
  score -= Math.min(placeholderCount * 2, 30);

  return Math.max(0, score);
}

// ─── 主函数 ──────────────────────────────────────────────

export function validatePrd(prdPath: string): PrdValidationResult {
  const content = readMarkdown(prdPath);
  const metadata = parseMetadata(content);

  const { errors: sectionErrors, _warnings: sectionWarnings } = checkSections(content, metadata);
  const scenarioErrors = validateScenario(metadata);

  const allErrors = [...sectionErrors, ...scenarioErrors];
  const score = calculateScore(content, metadata, allErrors, sectionWarnings);

  return {
    valid: allErrors.length === 0 && score >= 85,
    score,
    errors: allErrors,
    _warnings: sectionWarnings,
    metadata,
  };
}
