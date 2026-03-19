/**
 * Front Matter 统一解析层
 * 从 SKILL.md 提取 YAML front matter 元数据
 * @see TASK-ORCH-016, V2-13§5.6
 */
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { exists } from '../../shared/fs-utils.js';

// ─── 类型定义 ───────────────────────────────────────────

export type WriteMode = 'overwrite' | 'append' | 'merge';

export interface CompletionMarker {
  contains_pattern?: string;
  min_entities?: number;
}

export interface SkillFrontMatter {
  name?: string;
  description?: string;
  version?: string;
  write_mode?: WriteMode;
  required_mcps?: string[];
  completion_markers?: CompletionMarker[];
  [key: string]: unknown;
}

// ─── 解析函数 ───────────────────────────────────────────

const VALID_WRITE_MODES: WriteMode[] = ['overwrite', 'append', 'merge'];

/**
 * 从 markdown 内容提取 YAML front matter 原始文本
 * 返回 null 表示无 front matter
 */
export function extractRawFrontMatter(content: string): string | null {
  if (!content.startsWith('---')) return null;
  const endIdx = content.indexOf('---', 3);
  if (endIdx < 0) return null;
  return content.slice(3, endIdx).trim();
}

/**
 * 解析 front matter 字符串为 SkillFrontMatter
 * 对 write_mode 做枚举校验，非法值回退 overwrite
 */
export function parseFrontMatter(raw: string): SkillFrontMatter {
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  if (!parsed || typeof parsed !== 'object') return {};

  const obj = parsed as Record<string, unknown>;
  const result: SkillFrontMatter = { ...obj };

  // write_mode 枚举校验
  if (result.write_mode && !VALID_WRITE_MODES.includes(result.write_mode)) {
    result.write_mode = 'overwrite';
  }

  // required_mcps 类型校验
  if (result.required_mcps && !Array.isArray(result.required_mcps)) {
    result.required_mcps = undefined;
  }

  // completion_markers 类型校验
  if (result.completion_markers && !Array.isArray(result.completion_markers)) {
    result.completion_markers = undefined;
  }

  return result;
}

/**
 * 从文件路径解析 front matter
 * 文件不存在或无 front matter 返回空对象
 */
export function parseSkillFrontMatter(filePath: string): SkillFrontMatter {
  if (!exists(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8');
  const raw = extractRawFrontMatter(content);
  if (!raw) return {};
  try {
    return parseFrontMatter(raw);
  } catch {
    return {};
  }
}

/** 获取 write_mode，默认 overwrite */
export function resolveWriteMode(meta: SkillFrontMatter): WriteMode {
  return meta.write_mode ?? 'overwrite';
}
