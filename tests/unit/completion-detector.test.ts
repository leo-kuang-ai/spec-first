/**
 * 完成检测引擎测试
 * @see TASK-ORCH-009 (markers 语义扩展), TASK-ORCH-010 (检测引擎)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  checkContainsPattern,
  checkMinEntities,
  checkStructuralCompletion,
  loadCompletionMarkers,
  runCompletionCheck,
  runFullCompletionDetection,
} from '../../src/core/ai-orchestrator/completion-detector.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-completion');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── checkContainsPattern ────────────────────────────────

describe('checkContainsPattern', () => {
  it('字面量匹配', () => {
    expect(checkContainsPattern('# Hello\n## Summary\nDone', '## Summary')).toBe(true);
  });

  it('正则匹配', () => {
    expect(checkContainsPattern('Total: 42 items', 'Total:\\s+\\d+')).toBe(true);
  });

  it('不匹配返回 false', () => {
    expect(checkContainsPattern('no match here', '## Summary')).toBe(false);
  });

  it('非法正则回退字面量', () => {
    expect(checkContainsPattern('a[b', 'a[b')).toBe(true);
  });
});

// ─── checkMinEntities ────────────────────────────────────

describe('checkMinEntities', () => {
  it('有实质内容的标题计数正确', () => {
    const md = '# Title\nSome content\n## Section\nMore content\n## Empty\n';
    const result = checkMinEntities(md, 2);
    expect(result.passed).toBe(true);
    expect(result.actual).toBe(2);
  });

  it('空标题不计入', () => {
    const md = '# Title\n\n## Empty\n\n## Also Empty\n';
    const result = checkMinEntities(md, 1);
    expect(result.passed).toBe(false);
    expect(result.actual).toBe(0);
  });

  it('无标题内容返回 0', () => {
    const result = checkMinEntities('Just plain text', 1);
    expect(result.passed).toBe(false);
    expect(result.actual).toBe(0);
  });
});

// ─── checkStructuralCompletion ───────────────────────────

describe('checkStructuralCompletion', () => {
  it('所有标题有内容则通过', () => {
    const md = '# Intro\nHello world\n## Details\nSome details here';
    const result = checkStructuralCompletion(md);
    expect(result.passed).toBe(true);
    expect(result.emptyHeadings).toEqual([]);
  });

  it('识别"有标题无内容"假完成', () => {
    const md = '# Intro\nContent\n## TODO\n\n## Another Empty\n';
    const result = checkStructuralCompletion(md);
    expect(result.passed).toBe(false);
    expect(result.emptyHeadings).toContain('TODO');
    expect(result.emptyHeadings).toContain('Another Empty');
  });

  it('无标题的纯文本通过', () => {
    const result = checkStructuralCompletion('Just plain text without headings');
    expect(result.passed).toBe(true);
  });

  it('文件末尾空标题被检出', () => {
    const md = '# Done\nContent\n## Trailing';
    const result = checkStructuralCompletion(md);
    expect(result.passed).toBe(false);
    expect(result.emptyHeadings).toEqual(['Trailing']);
  });
});

// ─── loadCompletionMarkers（三层优先级） ──────────────────

describe('loadCompletionMarkers', () => {
  it('Layer 1: Skill 级 markers 优先', () => {
    const skillMeta = {
      completion_markers: [{ contains_pattern: 'custom' }],
    };
    const markers = loadCompletionMarkers(skillMeta, TMP);
    expect(markers).toEqual([{ contains_pattern: 'custom' }]);
  });

  it('Layer 2: 项目级 default-markers.yaml', () => {
    const yamlContent = '- contains_pattern: "## Result"\n- min_entities: 5';
    writeFileSync(join(TMP, '.spec-first', 'default-markers.yaml'), yamlContent, 'utf-8');
    const markers = loadCompletionMarkers(undefined, TMP);
    expect(markers).toHaveLength(2);
    expect(markers[0].contains_pattern).toBe('## Result');
    expect(markers[1].min_entities).toBe(5);
  });

  it('Layer 3: 无配置时返回全局默认', () => {
    const markers = loadCompletionMarkers(undefined, TMP);
    expect(markers).toHaveLength(2);
    expect(markers[0].contains_pattern).toBe('## Summary');
  });

  it('Skill 级空数组回退项目级', () => {
    const yamlContent = '- min_entities: 3';
    writeFileSync(join(TMP, '.spec-first', 'default-markers.yaml'), yamlContent, 'utf-8');
    const markers = loadCompletionMarkers({ completion_markers: [] }, TMP);
    expect(markers[0].min_entities).toBe(3);
  });
});

// ─── runCompletionCheck ──────────────────────────────────

describe('runCompletionCheck', () => {
  it('空 markers 直接通过', () => {
    const result = runCompletionCheck('anything', []);
    expect(result.passed).toBe(true);
    expect(result.checks).toHaveLength(0);
  });

  it('contains_pattern 通过', () => {
    const result = runCompletionCheck('## Summary\nDone', [
      { contains_pattern: '## Summary' },
    ]);
    expect(result.passed).toBe(true);
  });

  it('contains_pattern 失败带 reason', () => {
    const result = runCompletionCheck('no summary', [
      { contains_pattern: '## Summary' },
    ]);
    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain('not found');
  });

  it('min_entities 通过', () => {
    const md = '# A\nContent A\n## B\nContent B\n## C\nContent C';
    const result = runCompletionCheck(md, [{ min_entities: 3 }]);
    expect(result.passed).toBe(true);
  });

  it('min_entities 失败带 reason', () => {
    const result = runCompletionCheck('# Only\nOne', [{ min_entities: 3 }]);
    expect(result.passed).toBe(false);
    expect(result.checks[0].reason).toContain('expected');
  });

  it('多 marker 全部通过才算 passed', () => {
    const md = '## Summary\n# A\nContent\n# B\nContent';
    const result = runCompletionCheck(md, [
      { contains_pattern: '## Summary' },
      { min_entities: 2 },
    ]);
    expect(result.passed).toBe(true);
  });

  it('任一 marker 失败则 passed=false', () => {
    const md = '# A\nContent';
    const result = runCompletionCheck(md, [
      { contains_pattern: '## Summary' },
      { min_entities: 1 },
    ]);
    expect(result.passed).toBe(false);
  });
});

// ─── runFullCompletionDetection ──────────────────────────

describe('runFullCompletionDetection', () => {
  it('结构+语义双通过', () => {
    const md = '# Intro\nHello\n## Summary\nDone';
    const result = runFullCompletionDetection(md, [
      { contains_pattern: '## Summary' },
    ]);
    expect(result.passed).toBe(true);
    expect(result.failureReasons).toHaveLength(0);
  });

  it('结构失败（假完成）', () => {
    const md = '# Intro\nContent\n## Empty Section\n';
    const result = runFullCompletionDetection(md, []);
    expect(result.passed).toBe(false);
    expect(result.structural.passed).toBe(false);
    expect(result.failureReasons[0]).toContain('empty headings');
  });

  it('语义失败', () => {
    const md = '# Intro\nContent here';
    const result = runFullCompletionDetection(md, [
      { contains_pattern: '## Summary' },
    ]);
    expect(result.passed).toBe(false);
    expect(result.semantic.passed).toBe(false);
    expect(result.failureReasons[0]).toContain('not found');
  });

  it('结构+语义双失败聚合 reasons', () => {
    const md = '# Intro\nContent\n## Empty\n';
    const result = runFullCompletionDetection(md, [
      { contains_pattern: '## Summary' },
    ]);
    expect(result.passed).toBe(false);
    expect(result.failureReasons.length).toBeGreaterThanOrEqual(2);
  });
});
