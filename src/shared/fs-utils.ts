/**
 * 文件 I/O 封装层
 * 统一文件读写，便于单测 mock
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

function assertSafePath(path: string): string {
  if (typeof path !== 'string' || path.trim() === '') {
    throw new Error('路径不能为空');
  }
  if (path.includes('\0')) {
    throw new Error(`非法路径（包含空字节）: ${path}`);
  }

  const rawSegments = path.split(/[\\/]+/).filter(Boolean);
  if (rawSegments.includes('..')) {
    throw new Error(`检测到路径遍历: ${path}`);
  }

  return path;
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
