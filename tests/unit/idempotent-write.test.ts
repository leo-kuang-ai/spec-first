/**
 * P4 幂等写入策略测试 + 失败路径补齐
 * @see TASK-ORCH-015, TASK-ORCH-021
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { idempotentWrite } from '../../src/core/skill-runtime/idempotent-write.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-idempotent');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('overwrite mode', () => {
  it('新文件直接写入', () => {
    const p = join(TMP, 'new.md');
    const result = idempotentWrite(p, 'hello', 'overwrite');
    expect(result.written).toBe(true);
    expect(result.mode).toBe('overwrite');
    expect(readFileSync(p, 'utf-8')).toBe('hello');
  });

  it('已有文件覆盖写入（幂等）', () => {
    const p = join(TMP, 'exist.md');
    writeFileSync(p, 'old content', 'utf-8');
    idempotentWrite(p, 'new content', 'overwrite');
    expect(readFileSync(p, 'utf-8')).toBe('new content');
  });

  it('重复写入结果一致', () => {
    const p = join(TMP, 'repeat.md');
    idempotentWrite(p, 'same', 'overwrite');
    idempotentWrite(p, 'same', 'overwrite');
    expect(readFileSync(p, 'utf-8')).toBe('same');
  });
});

describe('append mode', () => {
  it('新文件直接写入', () => {
    const p = join(TMP, 'append-new.md');
    const result = idempotentWrite(p, 'line1\n', 'append');
    expect(result.written).toBe(true);
    expect(readFileSync(p, 'utf-8')).toBe('line1\n');
  });

  it('已有文件追加内容', () => {
    const p = join(TMP, 'append-exist.md');
    writeFileSync(p, 'line1\n', 'utf-8');
    idempotentWrite(p, 'line2\n', 'append');
    expect(readFileSync(p, 'utf-8')).toBe('line1\nline2\n');
  });

  it('重复追加不污染（幂等）', () => {
    const p = join(TMP, 'append-dup.md');
    writeFileSync(p, 'line1\n', 'utf-8');
    idempotentWrite(p, 'line1\n', 'append');
    const result = idempotentWrite(p, 'line1\n', 'append');
    expect(result.written).toBe(false);
  });
});

describe('merge mode', () => {
  it('新文件直接写入', () => {
    const p = join(TMP, 'merge-new.md');
    const result = idempotentWrite(p, 'content', 'merge');
    expect(result.written).toBe(true);
    expect(readFileSync(p, 'utf-8')).toBe('content');
  });

  it('已有非空文件不覆盖', () => {
    const p = join(TMP, 'merge-exist.md');
    writeFileSync(p, 'existing', 'utf-8');
    const result = idempotentWrite(p, 'new', 'merge');
    expect(result.written).toBe(false);
    expect(readFileSync(p, 'utf-8')).toBe('existing');
  });

  it('空文件写入', () => {
    const p = join(TMP, 'merge-empty.md');
    writeFileSync(p, '', 'utf-8');
    const result = idempotentWrite(p, 'content', 'merge');
    expect(result.written).toBe(true);
  });
});

describe('default mode', () => {
  it('不传 mode 默认 overwrite', () => {
    const p = join(TMP, 'default.md');
    const result = idempotentWrite(p, 'hello');
    expect(result.mode).toBe('overwrite');
    expect(result.written).toBe(true);
  });
});

// ─── 失败路径补齐（ORCH-021） ────────────────────────────

describe('append 幂等边界', () => {
  it('内容在中间出现也视为重复', () => {
    const p = join(TMP, 'append-mid.md');
    writeFileSync(p, 'aaa\nline1\nbbb\n', 'utf-8');
    const result = idempotentWrite(p, 'line1', 'append');
    expect(result.written).toBe(false);
  });
});

describe('结果 path 字段', () => {
  it('overwrite 返回正确 path', () => {
    const p = join(TMP, 'path-check.md');
    const result = idempotentWrite(p, 'x', 'overwrite');
    expect(result.path).toBe(p);
  });

  it('append 返回正确 path', () => {
    const p = join(TMP, 'path-append.md');
    const result = idempotentWrite(p, 'x', 'append');
    expect(result.path).toBe(p);
  });

  it('merge 返回正确 path', () => {
    const p = join(TMP, 'path-merge.md');
    const result = idempotentWrite(p, 'x', 'merge');
    expect(result.path).toBe(p);
  });
});

describe('merge 空白文件边界', () => {
  it('仅空白字符的文件视为空 → 写入', () => {
    const p = join(TMP, 'merge-whitespace.md');
    writeFileSync(p, '   \n  \n', 'utf-8');
    const result = idempotentWrite(p, 'content', 'merge');
    expect(result.written).toBe(true);
    expect(readFileSync(p, 'utf-8')).toBe('content');
  });
});
