/**
 * Front Matter 统一解析层测试 + 失败路径补齐
 * @see TASK-ORCH-016, TASK-ORCH-021
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  extractRawFrontMatter,
  parseFrontMatter,
  parseSkillFrontMatter,
  resolveWriteMode,
} from '../../src/core/skill-runtime/front-matter.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-front-matter');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('extractRawFrontMatter', () => {
  it('提取标准 front matter', () => {
    const content = '---\nname: test\n---\n# Body';
    expect(extractRawFrontMatter(content)).toBe('name: test');
  });

  it('无 front matter 返回 null', () => {
    expect(extractRawFrontMatter('# No front matter')).toBeNull();
  });

  it('缺少结束分隔符返回 null', () => {
    expect(extractRawFrontMatter('---\nname: test\n')).toBeNull();
  });
});

describe('parseFrontMatter', () => {
  it('解析基本字段', () => {
    const result = parseFrontMatter('name: test\ndescription: hello');
    expect(result.name).toBe('test');
    expect(result.description).toBe('hello');
  });

  it('解析 write_mode', () => {
    const result = parseFrontMatter('write_mode: append');
    expect(result.write_mode).toBe('append');
  });

  it('非法 write_mode 回退 overwrite', () => {
    const result = parseFrontMatter('write_mode: invalid');
    expect(result.write_mode).toBe('overwrite');
  });

  it('解析 required_mcps 数组', () => {
    const result = parseFrontMatter('required_mcps:\n  - mcp-a\n  - mcp-b');
    expect(result.required_mcps).toEqual(['mcp-a', 'mcp-b']);
  });

  it('required_mcps 非数组时清除', () => {
    const result = parseFrontMatter('required_mcps: not-array');
    expect(result.required_mcps).toBeUndefined();
  });

  it('解析 completion_markers', () => {
    const raw = 'completion_markers:\n  - contains_pattern: "## Summary"\n    min_entities: 3';
    const result = parseFrontMatter(raw);
    expect(result.completion_markers).toHaveLength(1);
    expect(result.completion_markers![0].contains_pattern).toBe('## Summary');
    expect(result.completion_markers![0].min_entities).toBe(3);
  });

  it('空字符串返回空对象', () => {
    expect(parseFrontMatter('')).toEqual({});
  });
});

describe('resolveWriteMode', () => {
  it('有 write_mode 时返回', () => {
    expect(resolveWriteMode({ write_mode: 'merge' })).toBe('merge');
  });

  it('无 write_mode 时默认 overwrite', () => {
    expect(resolveWriteMode({})).toBe('overwrite');
  });
});

// ─── 失败路径补齐（ORCH-021） ────────────────────────────

describe('extractRawFrontMatter 边界', () => {
  it('空分隔符之间返回空字符串', () => {
    expect(extractRawFrontMatter('------\n# Body')).toBe('');
  });

  it('空内容返回 null', () => {
    expect(extractRawFrontMatter('')).toBeNull();
  });
});

describe('parseFrontMatter 失败路径', () => {
  it('completion_markers 非数组时清除', () => {
    const result = parseFrontMatter('completion_markers: not-array');
    expect(result.completion_markers).toBeUndefined();
  });

  it('纯标量 YAML 返回空对象', () => {
    expect(parseFrontMatter('just a string')).toEqual({});
  });

  it('null YAML 返回空对象', () => {
    expect(parseFrontMatter('null')).toEqual({});
  });
});

describe('parseSkillFrontMatter', () => {
  it('文件不存在返回空对象', () => {
    expect(parseSkillFrontMatter(join(TMP, 'nonexistent.md'))).toEqual({});
  });

  it('文件无 front matter 返回空对象', () => {
    const p = join(TMP, 'no-fm.md');
    writeFileSync(p, '# Just a heading\nSome content', 'utf-8');
    expect(parseSkillFrontMatter(p)).toEqual({});
  });

  it('文件有合法 front matter 正常解析', () => {
    const p = join(TMP, 'valid.md');
    writeFileSync(p, '---\nname: my-skill\nwrite_mode: append\n---\n# Body', 'utf-8');
    const result = parseSkillFrontMatter(p);
    expect(result.name).toBe('my-skill');
    expect(result.write_mode).toBe('append');
  });

  it('畸形 YAML front matter 返回空对象', () => {
    const p = join(TMP, 'bad-yaml.md');
    writeFileSync(p, '---\n: invalid: [yaml\n---\n# Body', 'utf-8');
    const result = parseSkillFrontMatter(p);
    expect(result).toEqual({});
  });
});
