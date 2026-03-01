import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  readJson, writeJson, readMarkdown, writeMarkdown,
  appendJsonl, ensureDir, exists, readJsonChecked,
} from '../../src/shared/fs-utils.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-fs');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('readJson / writeJson', () => {
  it('should round-trip JSON', () => {
    const data = { foo: 1, bar: [2, 3] };
    const p = join(TMP, 'test.json');
    writeJson(p, data);
    expect(readJson(p)).toEqual(data);
  });

  it('should throw on invalid JSON', () => {
    const p = join(TMP, 'bad.json');
    writeFileSync(p, 'not json', 'utf-8');
    expect(() => readJson(p)).toThrow('无效 JSON');
  });

  it('should throw on missing file', () => {
    expect(() => readJson(join(TMP, 'nope.json'))).toThrow();
  });

  it('should block path traversal for readJson', () => {
    expect(() => readJson('../secrets.json')).toThrow('路径遍历');
  });

  it('should create parent dirs if missing', () => {
    const p = join(TMP, 'deep/nested/test.json');
    writeJson(p, { ok: true });
    expect(readJson(p)).toEqual({ ok: true });
  });
});

describe('readMarkdown / writeMarkdown', () => {
  it('should round-trip markdown', () => {
    const md = '# Title\n\nSome content.\n';
    const p = join(TMP, 'test.md');
    writeMarkdown(p, md);
    expect(readMarkdown(p)).toBe(md);
  });

  it('should block path traversal for writeMarkdown', () => {
    expect(() => writeMarkdown('../escape.md', '# blocked')).toThrow('路径遍历');
  });
});

describe('appendJsonl', () => {
  it('should append lines without reading whole file', () => {
    const p = join(TMP, 'log.jsonl');
    appendJsonl(p, { a: 1 });
    appendJsonl(p, { b: 2 });
    const lines = readFileSync(p, 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual({ a: 1 });
    expect(JSON.parse(lines[1])).toEqual({ b: 2 });
  });

  it('should end each line with newline', () => {
    const p = join(TMP, 'log2.jsonl');
    appendJsonl(p, { x: 1 });
    const raw = readFileSync(p, 'utf-8');
    expect(raw.endsWith('\n')).toBe(true);
  });
});

describe('ensureDir / exists', () => {
  it('should create nested dirs', () => {
    const d = join(TMP, 'a/b/c');
    expect(exists(d)).toBe(false);
    ensureDir(d);
    expect(exists(d)).toBe(true);
  });

  it('should be idempotent', () => {
    const d = join(TMP, 'idem');
    ensureDir(d);
    ensureDir(d);
    expect(exists(d)).toBe(true);
  });
});

describe('I2: assertSafePath improvements', () => {
  it('should allow absolute paths with .. segments (resolve them)', () => {
    const p = join(TMP, 'sub/../test-resolve.json');
    writeJson(p, { resolved: true });
    // resolve 后 sub/.. 消除，文件写入 TMP/test-resolve.json
    expect(readJson(join(TMP, 'test-resolve.json'))).toEqual({ resolved: true });
  });

  it('should reject relative paths', () => {
    expect(() => readJson('relative/path.json')).toThrow('路径遍历');
    expect(() => readJson('./local.json')).toThrow('路径遍历');
  });
});

describe('I3: readJsonChecked', () => {
  const isObj = (d: unknown): d is { name: string } =>
    typeof d === 'object' && d !== null && typeof (d as Record<string, unknown>).name === 'string';

  it('should return data when guard passes', () => {
    const p = join(TMP, 'valid.json');
    writeJson(p, { name: 'test', extra: 1 });
    expect(readJsonChecked(p, isObj)).toEqual({ name: 'test', extra: 1 });
  });

  it('should throw when guard fails', () => {
    const p = join(TMP, 'invalid.json');
    writeJson(p, { wrong: 'shape' });
    expect(() => readJsonChecked(p, isObj)).toThrow('不符合预期');
  });
});
