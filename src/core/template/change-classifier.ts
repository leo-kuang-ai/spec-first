/**
 * 变更分级分类器
 * 根据模板文件名和变更类型判断变更级别（Minor/Major/Critical）
 */
import type { RfcLevel } from '../../shared/types.js';
import {
  isCriticalTemplateName,
  isMajorTemplateName,
  classifyTemplateLevel,
  type TemplateLevel,
} from './template-level-classifier.js';

// ─── 类型定义 ───────────────────────────────────────────

export type ChangeLevel = TemplateLevel;

export interface ClassificationResult {
  level: ChangeLevel;
  reason: string;
  requiresConfirmation: boolean;
  autoUpdateSafe: boolean;
}

// ─── 核心函数 ───────────────────────────────────────────

/**
 * 判断模板名是否匹配 Critical 级别
 */
export function isCriticalTemplate(templateName: string): boolean {
  return isCriticalTemplateName(templateName);
}

/**
 * 判断模板名是否匹配 Major 级别
 */
export function isMajorTemplate(templateName: string): boolean {
  return isMajorTemplateName(templateName);
}

/**
 * 判断模板名是否匹配 Minor 级别
 */
export function isMinorTemplate(templateName: string): boolean {
  if (isCriticalTemplate(templateName) || isMajorTemplate(templateName)) return false;
  return true; // 默认为 Minor
}

/**
 * 分类模板变更级别
 * @param templateName 模板名称
 * @param changeType 变更类型（新增/修改/删除）
 * @returns 分类结果
 */
export function classifyChange(
  templateName: string,
  changeType: 'added' | 'modified' | 'deleted' | 'unchanged',
): ClassificationResult {
  // 未变更直接返回 Minor
  if (changeType === 'unchanged') {
    return {
      level: 'Minor',
      reason: '文件内容未变更',
      requiresConfirmation: false,
      autoUpdateSafe: true,
    };
  }

  const level = classifyTemplateLevel(templateName);

  // Critical 模式
  if (level === 'Critical') {
    return {
      level: 'Critical',
      reason: `关键配置/规则文件变更：${templateName}`,
      requiresConfirmation: true,
      autoUpdateSafe: false,
    };
  }

  // Major 模式
  if (level === 'Major') {
    return {
      level: 'Major',
      reason: `流程/Skill 模板变更：${templateName}`,
      requiresConfirmation: true, // 有 local 覆盖时需要确认
      autoUpdateSafe: false, // 需要检查 local 覆盖状态
    };
  }

  // 默认为 Minor
  return {
    level: 'Minor',
    reason: `文档/辅助模板变更：${templateName}`,
    requiresConfirmation: false,
    autoUpdateSafe: true,
  };
}

/**
 * 将 ChangeLevel 转换为 RfcLevel
 */
export function toRfcLevel(level: ChangeLevel): RfcLevel {
  switch (level) {
    case 'Minor':
      return 'Minor';
    case 'Major':
      return 'Major';
    case 'Critical':
      return 'Critical';
  }
}

/**
 * 根据多个变更结果判断整体变更级别
 * 取最高级别：Critical > Major > Minor
 */
export function getMaxLevel(results: ClassificationResult[]): ChangeLevel {
  if (results.some((r) => r.level === 'Critical')) return 'Critical';
  if (results.some((r) => r.level === 'Major')) return 'Major';
  return 'Minor';
}
