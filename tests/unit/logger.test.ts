import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeLog, readLog } from '../../src/shared/logger.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-logger');

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('writeLog', () => {
  it('should auto-inject ISO8601 timestamp', () => {
    const p = join(TMP, 'gate-history.jsonl');
    writeLog(p, { stage: '01_specify', status: 'PASS' });
    const records = readLog(p);
    expect(records).toHaveLength(1);
    expect(records[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(records[0].stage).toBe('01_specify');
  });

  it('should append without overwriting', () => {
    const p = join(TMP, 'test.jsonl');
    writeLog(p, { a: 1 });
    writeLog(p, { b: 2 });
    expect(readLog(p)).toHaveLength(2);
  });

  it('should override provided timestamp with current timestamp', () => {
    const p = join(TMP, 'gate-history.jsonl');
    writeLog(p, { stage: '01_specify', timestamp: '1900-01-01T00:00:00.000Z' });
    const records = readLog(p);
    expect(records).toHaveLength(1);
    expect(records[0].timestamp).not.toBe('1900-01-01T00:00:00.000Z');
  });
});

describe('readLog', () => {
  it('should skip corrupted jsonl lines', () => {
    const p = join(TMP, 'corrupted.jsonl');
    writeFileSync(p, '{"a":1}\n{broken json}\n{"b":2}\n', 'utf-8');
    const records = readLog(p);
    expect(records).toHaveLength(2);
    expect(records[0].a).toBe(1);
    expect(records[1].b).toBe(2);
  });
});
