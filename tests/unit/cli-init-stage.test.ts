import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleStage } from '../../src/cli/commands/stage.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-init-stage');

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  writeFileSync(
    join(TMP, '.spec-first', 'layer2', 'h5.yaml'),
    'platform: h5\n',
    'utf-8',
  );
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
});

describe('handleInit', () => {
  it('should return SUCCESS for --help', async () => {
    const code = await handleInit(['--help']);
    expect(code).toBe(0);
  });

  it('should initialize a feature successfully', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(0);
    const specsDir = join(TMP, 'specs');
    const entries = readdirSync(specsDir).filter((e) => e.startsWith('FSREQ-'));
    expect(entries.length).toBe(1);
  });

  it('should return VALIDATION_ERROR for missing --feat', async () => {
    const code = await handleInit(['--mode', 'N', '--size', 'S']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for invalid mode', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'X', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for invalid size', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'XL', '--platforms', 'h5']);
    expect(code).toBe(2);
  });

  it('should accept --title flag', async () => {
    const code = await handleInit(['--feat', 'PAY', '--mode', 'N', '--size', 'M', '--platforms', 'h5', '--title', 'Payment']);
    expect(code).toBe(0);
  });

  it('should return VALIDATION_ERROR when platforms is empty', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', '']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR for unknown platform name', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'claude-code']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR when no layer2 template exists', async () => {
    rmSync(join(TMP, '.spec-first', 'layer2'), { recursive: true, force: true });
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(2);
  });

  it('should keep init success when skill command registration fails', async () => {
    const claudeFile = join(TMP, '.claude');
    writeFileSync(claudeFile, 'occupied', 'utf-8');
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(0);
    const specsDir = join(TMP, 'specs');
    const entries = readdirSync(specsDir).filter((e) => e.startsWith('FSREQ-'));
    expect(entries.length).toBe(1);
  });

  it('should auto install hooks when .git exists', async () => {
    mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(0);
    expect(readdirSync(join(TMP, '.git', 'hooks'))).toContain('pre-commit');
    expect(readdirSync(join(TMP, '.git', 'hooks'))).toContain('commit-msg');
  });
});

describe('handleStage', () => {
  async function setupFeature(): Promise<string> {
    await handleInit(['--feat', 'STG', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    const entries = readdirSync(join(TMP, 'specs')).filter((e) => e.startsWith('FSREQ-'));
    return entries[0];
  }

  it('should show current stage', async () => {
    const fid = await setupFeature();
    const code = handleStage(['current', fid]);
    expect(code).toBe(0);
  });

  it('should advance successfully when init gate conditions are satisfied', async () => {
    const fid = await setupFeature();
    const code = handleStage(['advance', fid]);
    expect(code).toBe(0);
  });

  it('should advance with --force', async () => {
    const fid = await setupFeature();
    const code = handleStage(['advance', fid, '--force']);
    expect(code).toBe(0);
  });

  it('should cancel feature with reason', async () => {
    const fid = await setupFeature();
    const code = handleStage(['cancel', fid, '--reason', 'Requirements changed']);
    expect(code).toBe(0);
  });

  it('should return VALIDATION_ERROR for cancel without reason', async () => {
    const fid = await setupFeature();
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
