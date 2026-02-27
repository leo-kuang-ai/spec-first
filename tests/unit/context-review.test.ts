/**
 * _context.md 首次生成审核流测试
 * @see TASK-ORCH-018
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateContextDiff,
  reviewContextGeneration,
} from '../../src/core/ai-orchestrator/context-review.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-context-review');
const FEAT = 'FSREQ-TEST-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── generateContextDiff ────────────────────────────────

describe('generateContextDiff', () => {
  it('无变更返回 (no changes)', () => {
    expect(generateContextDiff('hello', 'hello')).toBe('(no changes)');
  });

  it('新增行标记 +', () => {
    const diff = generateContextDiff('', 'new line');
    expect(diff).toContain('+ new line');
  });

  it('删除行标记 -', () => {
    const diff = generateContextDiff('old line', '');
    expect(diff).toContain('- old line');
  });

  it('变更行同时有 + 和 -', () => {
    const diff = generateContextDiff('before', 'after');
    expect(diff).toContain('- before');
    expect(diff).toContain('+ after');
  });
});

// ─── reviewContextGeneration ────────────────────────────

describe('reviewContextGeneration', () => {
  it('文件不存在 → 首次生成需审核', () => {
    const result = reviewContextGeneration(FEAT, TMP, '# Context');
    expect(result.needsReview).toBe(true);
    expect(result.strategy).toBe('manual');
    expect(result.diff).toContain('+ # Context');
  });

  it('文件已存在且无变更 → auto accept', () => {
    writeFileSync(join(TMP, 'specs', FEAT, '_context.md'), '# Context', 'utf-8');
    const result = reviewContextGeneration(FEAT, TMP, '# Context');
    expect(result.needsReview).toBe(false);
    expect(result.strategy).toBe('auto');
  });

  it('文件已存在且有变更 → manual review with diff', () => {
    writeFileSync(join(TMP, 'specs', FEAT, '_context.md'), '# Old', 'utf-8');
    const result = reviewContextGeneration(FEAT, TMP, '# New');
    expect(result.needsReview).toBe(true);
    expect(result.strategy).toBe('manual');
    expect(result.diff).toContain('- # Old');
    expect(result.diff).toContain('+ # New');
  });

  it('已有审计事件 → skip', () => {
    // 写入审计日志模拟已审核（路径: specs/{featureId}/audit.jsonl）
    const record = {
      event: 'context_reviewed',
      featureId: FEAT,
      timestamp: new Date().toISOString(),
      prevHash: '',
      hash: 'abc',
    };
    writeFileSync(
      join(TMP, 'specs', FEAT, 'audit.jsonl'),
      JSON.stringify(record) + '\n',
      'utf-8',
    );
    const result = reviewContextGeneration(FEAT, TMP, '# New');
    expect(result.needsReview).toBe(false);
    expect(result.strategy).toBe('skip');
    expect(result.skipReason).toContain('context_reviewed');
  });
});
