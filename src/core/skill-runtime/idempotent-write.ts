/**
 * P4 幂等写入策略
 * write_mode: overwrite（默认）| append | merge
 * 回退重试不重复污染文件
 * @see TASK-ORCH-015, V2-13§5.2
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';
import type { WriteMode } from './front-matter.js';

export interface WriteResult {
  written: boolean;
  mode: WriteMode;
  path: string;
}

/**
 * 幂等写入：根据 write_mode 决定写入策略
 * - overwrite: 直接覆盖（默认，幂等）
 * - append: 追加内容（检查重复避免污染）
 * - merge: 保留已有内容，仅补充缺失部分
 */
export function idempotentWrite(
  path: string,
  content: string,
  mode: WriteMode = 'overwrite'
): WriteResult {
  switch (mode) {
    case 'overwrite':
      return writeOverwrite(path, content);
    case 'append':
      return writeAppend(path, content);
    case 'merge':
      return writeMerge(path, content);
    default:
      return writeOverwrite(path, content);
  }
}

// ─── 写入策略实现 ────────────────────────────────────────

/** overwrite: 直接覆盖，天然幂等 */
function writeOverwrite(path: string, content: string): WriteResult {
  writeFileSync(path, content, 'utf-8');
  return { written: true, mode: 'overwrite', path };
}

/** append: 追加，但检查尾部是否已包含相同内容避免重复 */
function writeAppend(path: string, content: string): WriteResult {
  if (exists(path)) {
    const existing = readFileSync(path, 'utf-8');
    if (existing.endsWith(content) || existing.includes(content)) {
      return { written: false, mode: 'append', path };
    }
    writeFileSync(path, existing + content, 'utf-8');
  } else {
    writeFileSync(path, content, 'utf-8');
  }
  return { written: true, mode: 'append', path };
}

/** merge: 保留已有内容，仅在文件不存在或为空时写入 */
function writeMerge(path: string, content: string): WriteResult {
  if (exists(path)) {
    const existing = readFileSync(path, 'utf-8').trim();
    if (existing.length > 0) {
      return { written: false, mode: 'merge', path };
    }
  }
  writeFileSync(path, content, 'utf-8');
  return { written: true, mode: 'merge', path };
}
