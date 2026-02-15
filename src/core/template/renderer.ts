/**
 * Handlebars 模板渲染引擎
 * 加载模板 → 编译 → 渲染 → 写入文件
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import Handlebars from 'handlebars';
import { exists, ensureDir, writeMarkdown } from '../../shared/fs-utils.js';
import { dirname } from 'node:path';

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

/** 模板根目录（相对于项目根） */
const TEMPLATE_DIR = 'templates';

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

  const tplPath = join(projectRoot, TEMPLATE_DIR, `${templateName}.hbs`);
  if (!exists(tplPath)) {
    throw new Error(`Template not found: ${tplPath}`);
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
  const tplPath = join(projectRoot, TEMPLATE_DIR, `${templateName}.hbs`);
  if (!exists(tplPath)) {
    throw new Error(`Template not found: ${tplPath}`);
  }

  const source = readFileSync(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  return compiled(context);
}
