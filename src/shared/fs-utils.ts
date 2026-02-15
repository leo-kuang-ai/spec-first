/**
 * 文件 I/O 封装层
 * 统一文件读写，便于单测 mock
 */
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export function readJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf-8');
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON in ${path}`);
  }
}

export function writeJson(path: string, data: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function readMarkdown(path: string): string {
  return readFileSync(path, 'utf-8');
}

export function writeMarkdown(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf-8');
}

export function appendJsonl(path: string, entry: Record<string, unknown>): void {
  ensureDir(dirname(path));
  appendFileSync(path, JSON.stringify(entry) + '\n', 'utf-8');
}

export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export function exists(path: string): boolean {
  return existsSync(path);
}
