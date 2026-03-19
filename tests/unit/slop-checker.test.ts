/**
 * Slop Checker 独立实现与双层规则加载测试
 * @see TASK-ORCH-020
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadSlopRules,
  runSlopCheck,
  formatSlopReport,
} from '../../src/core/ai-orchestrator/slop-checker.js';
import type { SlopRule } from '../../src/core/ai-orchestrator/slop-checker.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-slop-checker');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── loadSlopRules ──────────────────────────────────────

describe('loadSlopRules', () => {
  it('无项目级规则 → 返回全局默认', () => {
    const rules = loadSlopRules(TMP);
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some(r => r.id === 'slop-todo')).toBe(true);
  });

  it('项目级规则覆盖全局默认', () => {
    const custom: SlopRule[] = [
      { id: 'custom-1', pattern: 'XXX', severity: 'error', message: 'custom rule' },
    ];
    writeFileSync(
      join(TMP, '.spec-first', 'slop-rules.yaml'),
      `- id: custom-1\n  pattern: "XXX"\n  severity: error\n  message: "custom rule"\n`,
      'utf-8',
    );
    const rules = loadSlopRules(TMP);
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('custom-1');
  });

  it('无 projectRoot → 返回全局默认', () => {
    const rules = loadSlopRules();
    expect(rules.some(r => r.id === 'slop-fixme')).toBe(true);
  });
});

// ─── runSlopCheck ───────────────────────────────────────

describe('runSlopCheck', () => {
  const rules = loadSlopRules();

  it('无命中 → passed', () => {
    const report = runSlopCheck('clean code here', rules);
    expect(report.passed).toBe(true);
    expect(report.hits).toHaveLength(0);
  });

  it('warning 命中不阻断', () => {
    const report = runSlopCheck('// TODO: fix later', rules);
    expect(report.passed).toBe(true);
    expect(report.warningCount).toBe(1);
    expect(report.hits[0].ruleId).toBe('slop-todo');
    expect(report.hits[0].line).toBe(1);
  });

  it('error 命中阻断', () => {
    const report = runSlopCheck('// FIXME: broken', rules);
    expect(report.passed).toBe(false);
    expect(report.errorCount).toBe(1);
  });

  it('多行多规则命中', () => {
    const content = 'line1 TODO\nline2 FIXME\nline3 HACK';
    const report = runSlopCheck(content, rules);
    expect(report.hits).toHaveLength(3);
    expect(report.hits[1].line).toBe(2);
  });

  it('空规则 → 通过', () => {
    const report = runSlopCheck('anything', []);
    expect(report.passed).toBe(true);
  });
});

// ─── formatSlopReport ───────────────────────────────────

describe('formatSlopReport', () => {
  it('无命中显示通过', () => {
    const report = runSlopCheck('clean', loadSlopRules());
    expect(formatSlopReport(report)).toContain('通过');
  });

  it('有命中显示详情', () => {
    const report = runSlopCheck('FIXME here', loadSlopRules());
    const text = formatSlopReport(report);
    expect(text).toContain('失败');
    expect(text).toContain('[error]');
  });
});
