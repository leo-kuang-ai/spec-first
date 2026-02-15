import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleStage } from '../../src/cli/commands/stage.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-init-stage');

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('handleInit', () => {
  it('should initialize a feature successfully', () => {
    const code = handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', '']);
    expect(code).toBe(0);
    // stage-state.json should exist
    const specsDir = join(TMP, 'specs');
    const entries = readdirSync(specsDir).filter((e) => e.startsWith('FSREQ-'));
    expect(entries.length).toBe(1);
  });

  it('should return VALIDATION_ERROR for missing --feat', () => {
    const code = handleInit(['--mode', 'N', '--size', 'S']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for invalid mode', () => {
    const code = handleInit(['--feat', 'AUTH', '--mode', 'X', '--size', 'S']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for invalid size', () => {
    const code = handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'XL']);
    expect(code).toBe(2);
  });

  it('should accept --title flag', () => {
    const code = handleInit(['--feat', 'PAY', '--mode', 'N', '--size', 'M', '--platforms', '', '--title', 'Payment']);
    expect(code).toBe(0);
  });
});

describe('handleStage', () => {
  /** 初始化一个 Feature 并返回其 ID */
  function setupFeature(): string {
    handleInit(['--feat', 'STG', '--mode', 'N', '--size', 'S', '--platforms', '']);
    const entries = readdirSync(join(TMP, 'specs')).filter((e) => e.startsWith('FSREQ-'));
    return entries[0];
  }

  it('should show current stage', () => {
    const fid = setupFeature();
    const code = handleStage(['current', fid]);
    expect(code).toBe(0);
  });

  it('should return GATE_FAILED when gate unavailable by default', () => {
    const fid = setupFeature();
    const code = handleStage(['advance', fid]);
    expect(code).toBe(1);
  });

  it('should advance with --force', () => {
    const fid = setupFeature();
    const code = handleStage(['advance', fid, '--force']);
    expect(code).toBe(0);
  });

  it('should cancel feature with reason', () => {
    const fid = setupFeature();
    const code = handleStage(['cancel', fid, '--reason', 'Requirements changed']);
    expect(code).toBe(0);
  });

  it('should return VALIDATION_ERROR for cancel without reason', () => {
    const fid = setupFeature();
    const code = handleStage(['cancel', fid]);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    expect(handleStage(['unknown'])).toBe(2);
  });

  it('should return error for current with missing featureId', () => {
    expect(handleStage(['current'])).toBe(2);
  });

  it('should return error for advance with missing featureId', () => {
    expect(handleStage(['advance'])).toBe(2);
  });
});
