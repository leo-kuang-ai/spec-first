/**
 * JSONL 审计日志工具
 * 统一写入，自动注入 timestamp，支持月度轮转
 */
import { appendJsonl as rawAppend, exists } from './fs-utils.js';
import { readFileSync, renameSync } from 'node:fs';

export type LogType = 'gate-history' | 'metrics' | 'ai-stats' | 'golive-history';

/** 追加一条带 timestamp 的 JSONL 记录 */
export function writeLog(path: string, entry: Record<string, unknown>): void {
  const record = { ...entry, timestamp: new Date().toISOString() };
  // 轮转检查：行数 > 1000 时归档
  if (exists(path)) {
    const lineCount = countLines(path);
    if (lineCount > 1000) {
      rotateLog(path);
    }
  }
  rawAppend(path, record);
}

/** 读取 JSONL 文件，返回解析后的记录数组 */
export function readLog(path: string): Record<string, unknown>[] {
  if (!exists(path)) return [];
  const raw = readFileSync(path, 'utf-8').trim();
  if (!raw) return [];

  const records: Record<string, unknown>[] = [];
  const lines = raw.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        records.push(parsed as Record<string, unknown>);
      }
    } catch {
      // skip corrupted line to keep historical logs readable
    }
  }
  return records;
}

function countLines(path: string): number {
  const raw = readFileSync(path, 'utf-8');
  if (!raw.trim()) return 0;
  return raw.trim().split('\n').length;
}

function rotateLog(path: string): void {
  const now = new Date();
  const suffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getTime()}`;
  const nextPath = path.endsWith('.jsonl')
    ? path.replace(/\.jsonl$/, `-${suffix}.jsonl`)
    : `${path}-${suffix}`;

  let archivePath = nextPath;
  let seq = 1;
  while (exists(archivePath)) {
    archivePath = path.endsWith('.jsonl')
      ? path.replace(/\.jsonl$/, `-${suffix}-${seq}.jsonl`)
      : `${nextPath}-${seq}`;
    seq++;
  }
  renameSync(path, archivePath);
}
