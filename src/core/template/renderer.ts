/**
 * Handlebars 模板渲染引擎
 * 加载模板 → 编译 → 渲染 → 写入文件
 *
 * 模板查找顺序（优先级从高到低）：
 * 1. .spec-first/local/templates/（用户定制）
 * 2. .spec-first/meta/templates/（包级基线）
 * 3. templates/（包内默认）
 */
import { join, dirname } from 'node:path';
import { readFileSync } from 'node:fs';
import Handlebars from 'handlebars';
import { exists, ensureDir, writeMarkdown } from '../../shared/fs-utils.js';

export interface TemplateContext {
  featureId: string;
  title: string;
  mode: 'N' | 'I';
  size: 'S' | 'M' | 'L';
  platforms: string[];
  timestamp: string;
  author: string;
  [key: string]: unknown;
}

/** 模板根目录（相对于项目根）- 包内默认模板 */
const TEMPLATE_DIR = 'templates';

/** 本地定制模板目录 */
const LOCAL_TEMPLATE_DIR = '.spec-first/local/templates';

/** 包级基线模板目录 */
const META_TEMPLATE_DIR = '.spec-first/meta/templates';

/**
 * 查找模板文件的完整路径
 * 按优先级查找：local → meta → 包内 templates
 * @returns 找到的模板路径，若都不存在则返回 null
 */
function findTemplatePath(templateName: string, projectRoot: string): string | null {
  const fileName = `${templateName}.hbs`;

  // 1. 优先查找 local 定制
  const localPath = join(projectRoot, LOCAL_TEMPLATE_DIR, fileName);
  if (exists(localPath)) return localPath;

  // 2. 其次查找 meta 基线
  const metaPath = join(projectRoot, META_TEMPLATE_DIR, fileName);
  if (exists(metaPath)) return metaPath;

  // 3. 最后查找包内默认
  const defaultPath = join(projectRoot, TEMPLATE_DIR, fileName);
  if (exists(defaultPath)) return defaultPath;

  return null;
}

/**
 * 渲染模板并写入目标文件
 * @param templateName 模板路径（如 init/stage-state.json）→ templates/init/stage-state.json.hbs
 * @param context 模板变量
 * @param outputPath 输出文件绝对路径
 * @param projectRoot 项目根目录
 * @returns true=已写入, false=已跳过（文件已存在）
 */
export function renderTemplate(
  templateName: string,
  context: TemplateContext,
  outputPath: string,
  projectRoot: string,
): boolean {
  // 文件已存在则跳过
  if (exists(outputPath)) return false;

  const tplPath = findTemplatePath(templateName, projectRoot);
  if (!tplPath) {
    throw new Error(
      `Template not found: ${templateName}.hbs (searched in: ${LOCAL_TEMPLATE_DIR}, ${META_TEMPLATE_DIR}, ${TEMPLATE_DIR})`,
    );
  }

  const source = readFileSync(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  const rendered = compiled(context);

  ensureDir(dirname(outputPath));
  writeMarkdown(outputPath, rendered);
  return true;
}

/**
 * 渲染模板为字符串（不写入文件）
 */
export function renderToString(
  templateName: string,
  context: TemplateContext,
  projectRoot: string,
): string {
  const tplPath = findTemplatePath(templateName, projectRoot);
  if (!tplPath) {
    throw new Error(
      `Template not found: ${templateName}.hbs (searched in: ${LOCAL_TEMPLATE_DIR}, ${META_TEMPLATE_DIR}, ${TEMPLATE_DIR})`,
    );
  }

  const source = readFileSync(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  return compiled(context);
}
