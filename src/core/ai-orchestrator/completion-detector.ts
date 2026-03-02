/**
 * Completion Markers 语义字段扩展 + 完成检测引擎
 * @see TASK-ORCH-009 (markers 扩展), TASK-ORCH-010 (检测引擎)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { exists } from '../../shared/fs-utils.js';
import type { CompletionMarker, SkillFrontMatter } from '../skill-runtime/front-matter.js';

// ─── 类型定义 ───────────────────────────────────────────

export interface CompletionCheckResult {
  passed: boolean;
  checks: CompletionCheckItem[];
}

export interface CompletionCheckItem {
  marker: CompletionMarker;
  passed: boolean;
  reason?: string;
}

/** 结构检测结果（内置"假完成"检测） */
export interface StructuralCheckResult {
  passed: boolean;
  emptyHeadings: string[];
}

// ─── 单项检测函数 ─────────────────────────────────────────

/** contains_pattern 检测：内容中是否包含指定模式（支持正则） */
export function checkContainsPattern(content: string, pattern: string): boolean {
  try {
    const re = new RegExp(pattern, 's');
    return re.test(content);
  } catch {
    // 正则无效时回退为字面量匹配
    return content.includes(pattern);
  }
}

/** min_entities 检测：统计 markdown 中有实质内容的标题数量 */
export function checkMinEntities(content: string, minCount: number): { passed: boolean; actual: number } {
  const lines = content.split('\n');
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) {
      // 检查标题后是否有实质内容（非空行、非标题行）
      const hasContent = hasSubstantiveContent(lines, i + 1);
      if (hasContent) count++;
    }
  }

  return { passed: count >= minCount, actual: count };
}

/** 标题后是否有实质内容（到下一个标题或文件末尾之间） */
function hasSubstantiveContent(lines: string[], startIdx: number): boolean {
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    // 遇到下一个标题则停止
    if (/^#{1,6}\s+/.test(line)) return false;
    // 非空行视为有实质内容
    if (line.length > 0) return true;
  }
  return false;
}

// ─── 结构检测（假完成识别） ──────────────────────────────────

/**
 * 结构完成检测：识别"有标题无内容"等假完成模式
 * 扫描 markdown 标题，检查每个标题下是否有实质内容
 */
export function checkStructuralCompletion(content: string): StructuralCheckResult {
  const lines = content.split('\n');
  const emptyHeadings: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/);
    if (!match) continue;
    if (!hasSubstantiveContent(lines, i + 1)) {
      emptyHeadings.push(match[2].trim());
    }
  }

  return { passed: emptyHeadings.length === 0, emptyHeadings };
}

// ─── 三层加载优先级 ──────────────────────────────────────

/** 全局默认 markers（当无 Skill 级和项目级配置时使用） */
const DEFAULT_MARKERS: CompletionMarker[] = [
  { contains_pattern: '## Summary' },
  { min_entities: 2 },
];

/**
 * 三层优先级加载 completion_markers
 * 1. Skill 级（SKILL.md front matter）
 * 2. 项目级（.spec-first/default-markers.yaml）
 * 3. 全局默认（内置 DEFAULT_MARKERS）
 */
export function loadCompletionMarkers(
  skillMeta?: SkillFrontMatter,
  projectRoot?: string,
): CompletionMarker[] {
  // Layer 1: Skill 级
  if (skillMeta?.completion_markers && skillMeta.completion_markers.length > 0) {
    return skillMeta.completion_markers;
  }

  // Layer 2: 项目级 default-markers.yaml
  if (projectRoot) {
    const projectMarkersPath = join(projectRoot, '.spec-first', 'default-markers.yaml');
    const markers = loadMarkersFromYaml(projectMarkersPath);
    if (markers.length > 0) return markers;
  }

  // Layer 3: 全局默认
  return DEFAULT_MARKERS;
}

/** 从 YAML 文件加载 markers 数组 */
function loadMarkersFromYaml(filePath: string): CompletionMarker[] {
  if (!exists(filePath)) return [];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    if (!Array.isArray(parsed)) return [];
    return parsed as CompletionMarker[];
  } catch {
    return [];
  }
}

// ─── 检测引擎 ────────────────────────────────────────────

/**
 * 语义检测：逐项运行 markers 检查
 * 所有 marker 通过才算 passed
 */
export function runCompletionCheck(content: string, markers: CompletionMarker[]): CompletionCheckResult {
  if (markers.length === 0) {
    return { passed: true, checks: [] };
  }

  const checks: CompletionCheckItem[] = markers.map((marker) => {
    // contains_pattern 检测
    if (marker.contains_pattern) {
      const ok = checkContainsPattern(content, marker.contains_pattern);
      return {
        marker,
        passed: ok,
        reason: ok ? undefined : `pattern "${marker.contains_pattern}" not found`,
      };
    }

    // min_entities 检测
    if (marker.min_entities != null) {
      const { passed, actual } = checkMinEntities(content, marker.min_entities);
      return {
        marker,
        passed,
        reason: passed ? undefined : `expected ≥${marker.min_entities} entities, found ${actual}`,
      };
    }

    // 无可识别字段的 marker 默认通过
    return { marker, passed: true };
  });

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/** 完整检测结果（结构+语义双判定） */
export interface FullDetectionResult {
  passed: boolean;
  structural: StructuralCheckResult;
  semantic: CompletionCheckResult;
  failureReasons: string[];
}

/**
 * 完整完成检测引擎：结构+语义双判定
 * 任一维度失败即判定为未完成（假完成）
 */
export function runFullCompletionDetection(
  content: string,
  markers: CompletionMarker[],
): FullDetectionResult {
  const structural = checkStructuralCompletion(content);
  const semantic = runCompletionCheck(content, markers);

  const failureReasons: string[] = [];

  if (!structural.passed) {
    failureReasons.push(
      `empty headings detected: ${structural.emptyHeadings.join(', ')}`,
    );
  }

  for (const check of semantic.checks) {
    if (!check.passed && check.reason) {
      failureReasons.push(check.reason);
    }
  }

  return {
    passed: structural.passed && semantic.passed,
    structural,
    semantic,
    failureReasons,
  };
}
