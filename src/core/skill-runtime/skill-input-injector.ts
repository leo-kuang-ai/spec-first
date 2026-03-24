import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import {
  loadSkillInputContractsConfig,
  getDefaultConfig,
  type SkillInputContract,
  type SkillInputContractsConfig,
} from './skill-input-contracts.js';

// 内联模板（fallback）
const INLINE_TEMPLATE = `## 输入上下文

执行此 skill 时，从 \`.spec-first/runtime/first/\` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
{{#each required}}
| \`{{this}}\` | **必需** | {{lookup ../descriptions this}} |
{{/each}}
{{#each recommended}}
| \`{{this}}\` | 推荐 | {{lookup ../descriptions this}} |
{{/each}}
{{#each optional}}
| \`{{this}}\` | 可选 | {{lookup ../descriptions this}} |
{{/each}}

> **缺失处理**: 如果必需产物不存在，提示用户先执行 \`/spec-first:first\`
`;

// 缓存编译后的模板
let compiledTemplate: HandlebarsTemplateDelegate | null = null;

/**
 * 加载模板（优先从文件加载，fallback 到内联模板）
 */
function loadTemplate(): HandlebarsTemplateDelegate {
  if (compiledTemplate) return compiledTemplate;

  // 尝试从模板文件加载
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const templatePath = join(currentDir, '..', '..', '..', 'templates', 'skill-input-context.md.hbs');

  let templateContent: string;
  if (existsSync(templatePath)) {
    templateContent = readFileSync(templatePath, 'utf-8');
  } else {
    // Fallback 到内联模板
    templateContent = INLINE_TEMPLATE;
  }

  compiledTemplate = Handlebars.compile(templateContent);
  return compiledTemplate;
}

/**
 * 渲染输入上下文章节
 */
export function renderInputContextSection(
  contract: SkillInputContract,
  descriptions: Record<string, string>
): string {
  const template = loadTemplate();
  return template({
    required: contract.required,
    recommended: contract.recommended,
    optional: contract.optional,
    descriptions,
  });
}

/**
 * 检查 SKILL.md 是否已有输入上下文章节
 */
function hasInputContextSection(content: string): boolean {
  return /^## 输入上下文/m.test(content);
}

/**
 * 查找插入位置（在第一个 ## 标题之前，但跳过 frontmatter）
 */
function findInsertPosition(content: string): number {
  // 在 frontmatter 之后找第一个 ## 标题
  const fmEnd = content.indexOf('\n---', 4);
  let searchStart = 0;

  if (fmEnd >= 0) {
    // 找到 frontmatter 结束后的位置
    const afterFm = content.indexOf('\n', fmEnd + 4) + 1;
    searchStart = afterFm;
  }

  // 找到第一个 ## 标题
  const firstSectionMatch = content.slice(searchStart).match(/^## /m);
  if (firstSectionMatch && firstSectionMatch.index !== undefined) {
    return searchStart + firstSectionMatch.index;
  }

  // 如果没有找到任何章节，插入到文件末尾
  return content.length;
}

/**
 * 从路径提取 skill 名称（跨平台兼容）
 */
function extractSkillNameFromPath(skillMdPath: string): string {
  // 使用 path 模块处理跨平台路径
  const normalizedPath = skillMdPath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const dirName = parts[parts.length - 2] || '';
  return dirName.replace(/^\d+-/, '');
}

export interface InjectResult {
  skillName: string;
  injected: boolean;
  reason: string;
}

/**
 * 获取配置（支持 fallback 到默认配置）
 */
function resolveConfig(skillsRoot: string | null): SkillInputContractsConfig {
  if (skillsRoot) {
    return loadSkillInputContractsConfig(skillsRoot);
  }
  return getDefaultConfig();
}

/**
 * 为单个 SKILL.md 注入输入上下文章节
 * @param skillMdPath SKILL.md 文件路径
 * @param skillsRoot skills 根目录（为 null 时使用默认配置）
 * @param options 选项
 */
export function injectInputContextToSkillMd(
  skillMdPath: string,
  skillsRoot: string | null,
  options?: { force?: boolean }
): InjectResult {
  const skillName = extractSkillNameFromPath(skillMdPath);
  const config = resolveConfig(skillsRoot);

  // 检查是否应该跳过
  if (!config.auto_inject || config.skip_injection.includes(skillName)) {
    return { skillName, injected: false, reason: 'in skip_injection list' };
  }

  // 读取现有内容
  if (!existsSync(skillMdPath)) {
    return { skillName, injected: false, reason: 'SKILL.md not found' };
  }

  const content = readFileSync(skillMdPath, 'utf-8');

  // 检查是否已有章节
  if (hasInputContextSection(content) && !options?.force) {
    return {
      skillName,
      injected: false,
      reason: 'section already exists (use --force to override)',
    };
  }

  // 获取配置并渲染
  const contract = config.skills[skillName] ?? config.defaults;
  const section = renderInputContextSection(contract, config.descriptions);

  let newContent: string;

  if (hasInputContextSection(content) && options?.force) {
    // 替换现有章节 - 匹配从 "## 输入上下文" 开始到下一个 "## " 或文件结束
    const sectionRegex = /## 输入上下文[\s\S]*?(?=\n## |\n---\n?$|$)/;
    const match = content.match(sectionRegex);
    if (match && match[0]) {
      newContent = content.replace(match[0], section.trimEnd());
    } else {
      // fallback: 直接插入新章节
      const insertPos = findInsertPosition(content);
      newContent =
        content.slice(0, insertPos) +
        section +
        '\n\n' +
        content.slice(insertPos);
    }
  } else {
    // 插入新章节
    const insertPos = findInsertPosition(content);
    newContent =
      content.slice(0, insertPos) +
      section +
      '\n\n' +
      content.slice(insertPos);
  }

  writeFileSync(skillMdPath, newContent, 'utf-8');

  return { skillName, injected: true, reason: 'success' };
}

/**
 * 批量注入所有 skill
 */
export function injectInputContextToAllSkills(
  skillsRoot: string | null,
  options?: { force?: boolean; skills?: string[] }
): InjectResult[] {
  const results: InjectResult[] = [];

  // 如果 skillsRoot 不存在，返回空结果
  if (!skillsRoot || !existsSync(skillsRoot)) {
    return results;
  }

  // 遍历 skills 目录
  const entries = readdirSync(skillsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillName = entry.name.replace(/^\d+-/, '');
    const skillMdPath = join(skillsRoot, entry.name, 'SKILL.md');

    // 如果指定了 skill 列表，只处理列表中的
    if (options?.skills && !options.skills.includes(skillName)) {
      continue;
    }

    if (existsSync(skillMdPath)) {
      results.push(injectInputContextToSkillMd(skillMdPath, skillsRoot, options));
    }
  }

  return results;
}
