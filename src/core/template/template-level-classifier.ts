/**
 * 模板分级规则（单一来源）
 * 用于 hash-registry 与 change-classifier 统一判定
 */

export type TemplateLevel = 'Minor' | 'Major' | 'Critical';

/** Critical 模式：配置文件、规则文件 */
export const CRITICAL_PATTERNS: RegExp[] = [
  /config/i,
  /rule/i,
  /gate/i,
  /threshold/i,
  /settings/i,
  /\.ya?ml$/,
];

/** Major 模式：流程模板、Skill 模板 */
export const MAJOR_PATTERNS: RegExp[] = [
  /skill/i,
  /workflow/i,
  /process/i,
  /^0\d_/,
  /^(init|setup|bootstrap)/i,
  /(spec|design|plan|implement|verify|release)/i,
];

export function isCriticalTemplateName(templateName: string): boolean {
  return CRITICAL_PATTERNS.some((pattern) => pattern.test(templateName));
}

export function isMajorTemplateName(templateName: string): boolean {
  if (isCriticalTemplateName(templateName)) return false;
  return MAJOR_PATTERNS.some((pattern) => pattern.test(templateName));
}

export function classifyTemplateLevel(templateName: string): TemplateLevel {
  if (isCriticalTemplateName(templateName)) return 'Critical';
  if (isMajorTemplateName(templateName)) return 'Major';
  return 'Minor';
}

