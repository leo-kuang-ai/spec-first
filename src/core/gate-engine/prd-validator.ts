/**
 * PRD 校验与评分
 * 章节完整性 + 场景校验 + C-PRD 评分
 */
import { readMarkdown } from '../../shared/fs-utils.js';
import yaml from 'js-yaml';

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

const REQUIRED_SECTIONS = ['## 1. 业务目标', '## 2. 功能需求', '## 3. 非功能需求'];

const GREENFIELD_SECTIONS = [
  '### 1.1 问题陈述',
  '### 1.2 业务价值',
  '### 2.1 核心功能',
  '### 2.2 用户旅程',
];

const ITERATION_SECTIONS = [
  '### 1.1 现有功能',
  '### 1.2 存在问题',
  '### 2.1 改进方向',
  '### 2.2 成功指标',
];

// ─── 元信息解析 ──────────────────────────────────────────

function parseMetadata(content: string): PrdMetadata {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  let parsed: Record<string, unknown>;
  try {
    const loaded = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
    if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) return {};
    parsed = loaded as Record<string, unknown>;
  } catch {
    return {};
  }

  const meta: PrdMetadata = {};

  if (typeof parsed.scenario === 'string') {
    meta.scenario = parsed.scenario;
  }
  if (typeof parsed.scenario_reason === 'string') {
    meta.scenario_reason = parsed.scenario_reason;
  }
  if (Array.isArray(parsed.evidence_paths)) {
    meta.evidence_paths = parsed.evidence_paths
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (typeof parsed.evidence_paths === 'string' && parsed.evidence_paths.trim().length > 0) {
    meta.evidence_paths = [parsed.evidence_paths.trim()];
  }
  if (typeof parsed.complexity === 'string') {
    meta.complexity = parsed.complexity;
  }
  if (typeof parsed.created_at === 'string') {
    meta.created_at = parsed.created_at;
  }
  if (typeof parsed.last_updated === 'string') {
    meta.last_updated = parsed.last_updated;
  }

  return meta;
}

// ─── 章节完整性检查 ──────────────────────────────────────

function checkSections(
  content: string,
  meta: PrdMetadata
): { errors: string[]; _warnings: string[] } {
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

function calculateScore(
  content: string,
  meta: PrdMetadata,
  errors: string[],
  _warnings: string[]
): number {
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
