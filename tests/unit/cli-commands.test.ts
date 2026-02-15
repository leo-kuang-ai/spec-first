import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleId } from '../../src/cli/commands/id.js';
import { handleMatrix } from '../../src/cli/commands/matrix.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-cmd');
const FEAT_ID = 'FSREQ-20260211-AUTH-001';
const SPEC_DIR = join(TMP, 'specs', FEAT_ID);

const MATRIX = `| ID | Type | Title | Status | Upstream | Downstream |
|----|------|-------|--------|----------|------------|
| FR-AUTH-001 | FR | Login | Planned |  |  |
| DS-AUTH-001 | DS | Design | Planned | FR-AUTH-001 |  |
`;

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
  writeFileSync(join(SPEC_DIR, 'traceability-matrix.md'), MATRIX, 'utf-8');
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('handleId', () => {
  it('should validate a valid ID', () => {
    expect(handleId(['validate', 'FR-AUTH-001'])).toBe(0);
  });

  it('should reject invalid ID', () => {
    expect(handleId(['validate', 'INVALID'])).toBe(2);
  });

  it('should return error for missing subcommand', () => {
    expect(handleId(['unknown'])).toBe(2);
  });

  it('should generate next ID', () => {
    const code = handleId(['next', 'FR', 'AUTH', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should search IDs', () => {
    const code = handleId(['search', 'AUTH', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should list IDs', () => {
    const code = handleId(['list', '--feature', FEAT_ID]);
    expect(code).toBe(0);
  });
});

describe('handleMatrix', () => {
  it('should check matrix', () => {
    const code = handleMatrix(['check', FEAT_ID]);
    // Returns GATE_FAILED (1) because FR-AUTH-001 has broken chains
    expect(code).toBe(1);
  });

  it('should export matrix as markdown', () => {
    const code = handleMatrix(['export', FEAT_ID]);
    expect(code).toBe(0);
  });

  it('should export matrix as yaml', () => {
    const code = handleMatrix(['export', FEAT_ID, '--format', 'yaml']);
    expect(code).toBe(0);
  });

  it('should return error for missing featureId', () => {
    expect(handleMatrix(['check'])).toBe(2);
  });

  it('should return error for unknown subcommand', () => {
    expect(handleMatrix(['unknown'])).toBe(2);
  });
});
