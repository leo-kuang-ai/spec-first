import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { handleRfc } from '../../src/cli/commands/rfc.js';
import { handleDefect } from '../../src/cli/commands/defect.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-cm');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

/** 用 cwd stub 让 CLI handler 使用 TMP 目录 */
function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

describe('RFC CLI', () => {
  it('should create RFC', () => {
    const code = withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'Change API']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should reject create without title', () => {
    const code = withCwd(TMP, () => handleRfc(['create', FEAT]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should reject invalid level', () => {
    const code = withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'X', '--level', 'Bad']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should submit RFC', () => {
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'Test']));
    const code = withCwd(TMP, () => handleRfc(['submit', 'RFC-001', '--feature', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should transition RFC', () => {
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'Test']));
    const code = withCwd(TMP, () => handleRfc(['transition', 'RFC-001', 'approved', '--feature', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should reject invalid transition status', () => {
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'Test']));
    const code = withCwd(TMP, () => handleRfc(['transition', 'RFC-001', 'bad', '--feature', FEAT]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should list RFCs', () => {
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'A']));
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'B']));
    const code = withCwd(TMP, () => handleRfc(['list', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should get RFC details', () => {
    withCwd(TMP, () => handleRfc(['create', FEAT, '--title', 'Test']));
    const code = withCwd(TMP, () => handleRfc(['get', 'RFC-001', '--feature', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return error for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleRfc(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

describe('Defect CLI', () => {
  it('should register defect', () => {
    const code = withCwd(TMP, () =>
      handleDefect(['register', FEAT, '--severity', 'S2', '--title', 'Bug A']),
    );
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should reject register without required flags', () => {
    const code = withCwd(TMP, () => handleDefect(['register', FEAT]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should reject invalid severity', () => {
    const code = withCwd(TMP, () =>
      handleDefect(['register', FEAT, '--severity', 'S9', '--title', 'X']),
    );
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should update (transition) defect status', () => {
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S2', '--title', 'Bug']));
    const code = withCwd(TMP, () => handleDefect(['update', FEAT, '1', 'fixing']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should update defect status with --status flag', () => {
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S2', '--title', 'Bug']));
    const code = withCwd(TMP, () => handleDefect(['update', FEAT, '1', '--status', 'fixing', '--actor', 'qa']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should reject update with invalid status', () => {
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S2', '--title', 'Bug']));
    const code = withCwd(TMP, () => handleDefect(['update', FEAT, '1', 'bad']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should reject update with invalid seq', () => {
    const code = withCwd(TMP, () => handleDefect(['update', FEAT, 'abc', 'fixing']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should list defects', () => {
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S2', '--title', 'A']));
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S1', '--title', 'B']));
    const code = withCwd(TMP, () => handleDefect(['list', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should get defect details', () => {
    withCwd(TMP, () => handleDefect(['register', FEAT, '--severity', 'S3', '--title', 'Test']));
    const code = withCwd(TMP, () => handleDefect(['get', FEAT, '1']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should reject get with missing seq', () => {
    const code = withCwd(TMP, () => handleDefect(['get', FEAT]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should calculate escape rate', () => {
    const code = withCwd(TMP, () => handleDefect(['escape-rate', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return error for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleDefect(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});
