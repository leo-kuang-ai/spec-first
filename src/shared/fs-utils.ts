/**
 * 文件 I/O 封装层
 * 统一文件读写，便于单测 mock
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

function assertSafePath(path: string): string {
  if (typeof path !== 'string' || path.trim() === '') {
    throw new Error('路径不能为空');
  }
  if (path.includes('\0')) {
    throw new Error(`非法路径（包含空字节）: ${path}`);
  }
  // I2: 拒绝相对路径（防止路径遍历），允许含 .. 的合法绝对路径
  if (!isAbsolute(path)) {
    throw new Error(`检测到路径遍历: ${path}`);
  }
  // resolve 消除绝对路径中的 .. 段
  return resolve(path);
}

export function readJson<T>(path: string): T {
  const safePath = assertSafePath(path);
  const raw = readFileSync(safePath, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`${safePath} 中存在无效 JSON`);
  }
}

/** I3: 带运行时 shape check 的 readJson，用于安全敏感路径 */
export function readJsonChecked<T>(path: string, guard: (data: unknown) => data is T): T {
  const safePath = assertSafePath(path);
  const raw = readFileSync(safePath, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${safePath} 中存在无效 JSON`);
  }
  if (!guard(parsed)) {
    throw new Error(`${safePath} JSON 结构不符合预期`);
  }
  return parsed;
}

export function writeJson(path: string, data: unknown): void {
  const safePath = assertSafePath(path);
  ensureDir(dirname(safePath));
  writeFileSync(safePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function readMarkdown(path: string): string {
  const safePath = assertSafePath(path);
  return readFileSync(safePath, 'utf-8');
}

export function writeMarkdown(path: string, content: string): void {
  const safePath = assertSafePath(path);
  ensureDir(dirname(safePath));
  writeFileSync(safePath, content, 'utf-8');
}

export function appendJsonl(path: string, entry: Record<string, unknown>): void {
  const safePath = assertSafePath(path);
  ensureDir(dirname(safePath));
  appendFileSync(safePath, JSON.stringify(entry) + '\n', 'utf-8');
}

export function ensureDir(path: string): void {
  const safePath = assertSafePath(path);
  if (!existsSync(safePath)) {
    mkdirSync(safePath, { recursive: true });
  }
}

export function exists(path: string): boolean {
  const safePath = assertSafePath(path);
  return existsSync(safePath);
}

/** S1: 统一 Markdown 表格解析，跳过表头和分隔行，返回数据行的 cells */
export function parseMarkdownTable(content: string): string[][] {
  const rows: string[][] = [];
  let headerSkipped = false;
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    if (/^\|[\s\-:|]+$/.test(trimmed)) {
      headerSkipped = true;
      continue;
    }
    if (!headerSkipped) continue;
    const parts = trimmed.split('|').slice(1);
    if (parts.at(-1)?.trim() === '') parts.pop();
    rows.push(parts.map((c) => c.trim()));
  }
  return rows;
}
