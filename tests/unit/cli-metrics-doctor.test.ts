import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleMetrics } from '../../src/cli/commands/metrics.js';
import { handleDoctor } from '../../src/cli/commands/doctor.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-metrics-doctor');
const FEAT = 'FSREQ-20260211-AUTH-001';
const ORIGINAL_HOME = process.env.HOME;

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), '{}');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (ORIGINAL_HOME === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = ORIGINAL_HOME;
  }
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
    writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'version: 1');
    const code = withCwd(TMP, () => handleDoctor([]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS with warnings when config missing', () => {
    // .spec-first/ exists but no config.yaml → WARNING, not ERROR
    const code = withCwd(TMP, () => handleDoctor([]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should mention built-in defaults when config is missing', () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
      withCwd(TMP, () => handleDoctor([]));
    } finally {
      console.log = originalLog;
    }
    expect(lines.join('\n')).toContain('未找到（使用内置默认值）');
  });

  it('should parse pilot_mode via yaml instead of string matching', () => {
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'gate:\n  pilot_mode: false\n# pilot_mode: true\n',
      'utf-8',
    );
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
      withCwd(TMP, () => handleDoctor([FEAT]));
    } finally {
      console.log = originalLog;
    }
    expect(lines.join('\n')).toContain('Gate Degradation');
    expect(lines.join('\n')).toContain('强校验模式');
  });

  it('should return SUCCESS with feature checks when feature exists', () => {
    writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'version: 1');
    writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), '{}');
    const code = withCwd(TMP, () => handleDoctor([FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return CONFIG_ERROR when feature dir not found', () => {
    writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'version: 1');
    const code = withCwd(TMP, () => handleDoctor(['NONEXISTENT']));
    expect(code).toBe(ExitCode.CONFIG_ERROR);
  });

  it('should return CONFIG_ERROR when stage-state.json missing', () => {
    writeFileSync(join(TMP, '.spec-first', 'meta', 'config.yaml'), 'version: 1');
    rmSync(join(TMP, 'specs', FEAT, 'stage-state.json'), { force: true });
    // Feature dir exists (from beforeEach) but no stage-state.json
    const code = withCwd(TMP, () => handleDoctor([FEAT]));
    expect(code).toBe(ExitCode.CONFIG_ERROR);
  });

  it('should skip hook warnings when no git repository', () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
      withCwd(TMP, () => handleDoctor([]));
    } finally {
      console.log = originalLog;
    }
    expect(lines.join('\n')).toContain('Git Hooks');
    expect(lines.join('\n')).toContain('已跳过');
  });

  it('should warn when Session Hook misses required bootstrap segments', () => {
    const fakeHome = join(TMP, 'fake-home');
    mkdirSync(join(fakeHome, '.claude'), { recursive: true });
    writeFileSync(
      join(fakeHome, '.claude', 'settings.json'),
      JSON.stringify({
        hooks: {
          SessionStart: [{
            matcher: '*',
            hooks: [{ type: 'command', command: 'spec-first viewer open --background' }],
          }],
        },
      }),
      'utf-8',
    );
    process.env.HOME = fakeHome;

    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
      withCwd(TMP, () => handleDoctor([]));
    } finally {
      console.log = originalLog;
    }

    const joined = lines.join('\n');
    expect(joined).toContain('Session Hook');
    expect(joined).toContain('内容不完整');
    expect(joined).toContain('技能路由表');
    expect(joined).toContain('1%规则');
    expect(joined).toContain('catchup 提示');
  });
});
