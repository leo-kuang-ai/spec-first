import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  readJson, writeJson, readMarkdown, writeMarkdown,
  appendJsonl, ensureDir, exists,
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
    expect(() => readJson(p)).toThrow('Invalid JSON');
  });

  it('should throw on missing file', () => {
    expect(() => readJson(join(TMP, 'nope.json'))).toThrow();
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
