import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleMetrics } from '../../src/cli/commands/metrics.js';
import { handleDoctor } from '../../src/cli/commands/doctor.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-metrics-doctor');
const FEAT = 'FSREQ-20260211-AUTH-001';

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), '{}');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('handleMetrics', () => {
  it('should return VALIDATION_ERROR without featureId', () => {
    const code = withCwd(TMP, () => handleMetrics(['coverage']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return SUCCESS with valid matrix', () => {
    // 写入一个简单的 traceability-matrix.md
    writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'),
      '| ID | Type | Title | Status | Upstream | Downstream |\n' +
      '|----|------|-------|--------|----------|------------|\n' +
      '| FR-AUTH-001 | FR | Login | Planned |  |  |\n',
    );
    const code = withCwd(TMP, () => handleMetrics(['coverage', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return VALIDATION_ERROR when feature does not exist', () => {
    const code = withCwd(TMP, () => handleMetrics(['coverage', 'NONEXISTENT']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleMetrics(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

describe('handleDoctor', () => {
  it('should return SUCCESS when project structure is valid', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), 'version: 1');
    const code = withCwd(TMP, () => handleDoctor([]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS with warnings when config missing', () => {
    // .spec-first/ exists but no config.yaml → WARNING, not ERROR
    const code = withCwd(TMP, () => handleDoctor([]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS with feature checks when feature exists', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), 'version: 1');
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), '{}');
    const code = withCwd(TMP, () => handleDoctor([FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return CONFIG_ERROR when feature dir not found', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), 'version: 1');
    const code = withCwd(TMP, () => handleDoctor(['NONEXISTENT']));
    expect(code).toBe(ExitCode.CONFIG_ERROR);
  });

  it('should return CONFIG_ERROR when stage-state.json missing', () => {
    writeFileSync(join(TMP, '.spec-first', 'config.yaml'), 'version: 1');
    rmSync(join(TMP, 'specs', FEAT, 'stage-state.json'), { force: true });
    // Feature dir exists (from beforeEach) but no stage-state.json
    const code = withCwd(TMP, () => handleDoctor([FEAT]));
    expect(code).toBe(ExitCode.CONFIG_ERROR);
  });
});
