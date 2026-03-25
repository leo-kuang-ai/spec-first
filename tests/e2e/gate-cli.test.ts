/**
 * Gate CLI E2E 测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleGate } from '../../src/cli/commands/gate.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-gate-e2e');
const FEAT = 'FSREQ-20260312-E2E-001';
const origCwd = process.cwd;

function writeState(stage: string) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      currentStage: stage,
      history: [],
      terminal: false,
      createdAt: '2026-03-12T00:00:00Z',
      updatedAt: '2026-03-12T00:00:00Z',
    })
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('gate CLI output', () => {
  it('should retire gate check entry point', () => {
    writeState('01_specify');
    expect(handleGate(['check', FEAT])).toBe(2);
  });

  it('should not persist gate-history.jsonl', () => {
    writeState('00_init');
    expect(handleGate(['check', FEAT])).toBe(2);
    expect(() => rmSync(join(TMP, 'specs', FEAT, 'gate-history.jsonl'), { force: true })).not.toThrow();
  });
});
