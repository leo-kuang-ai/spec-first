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
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({
      featureId: FEAT,
      currentStage: '03_plan',
      mode: 'N',
      size: 'M',
      platforms: ['h5'],
      history: [],
      terminal: false,
      createdAt: '2026-03-23T00:00:00.000Z',
      updatedAt: '2026-03-23T00:00:00.000Z',
    }),
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    [
      'version: 1',
      `featureId: ${FEAT}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '',
    ].join('\n'),
    'utf-8'
  );
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
    const code = withCwd(TMP, () => handleMetrics(['report']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for retired metrics command', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
    const code = withCwd(TMP, () => handleMetrics(['report', FEAT]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR when feature does not exist', () => {
    const code = withCwd(TMP, () => handleMetrics(['report', 'NONEXISTENT']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleMetrics(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });
});

describe('handleDoctor', () => {
  it('should use dry-run bootstrap by default', () => {
    let observedDryRun: boolean | undefined;

    const code = withCwd(TMP, () =>
      handleDoctor([], {
        bootstrapFn: (options) => {
          observedDryRun = options?.dryRun;
          return { ok: true, results: [] };
        },
      })
    );

    expect(code).toBe(ExitCode.SUCCESS);
    expect(observedDryRun).toBe(true);
  });

  it('should use apply mode when --fix is provided', () => {
    let observedDryRun: boolean | undefined;

    const code = withCwd(TMP, () =>
      handleDoctor(['--fix'], {
        bootstrapFn: (options) => {
          observedDryRun = options?.dryRun;
          return { ok: true, results: [] };
        },
      })
    );

    expect(code).toBe(ExitCode.SUCCESS);
    expect(observedDryRun).toBe(false);
  });

  it('should reject unknown doctor flags', () => {
    const code = withCwd(TMP, () => handleDoctor(['--unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

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

  it('should report tool policy selections for baseline scenarios', () => {
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
    expect(joined).toContain('Tool Policy:claude:external-research');
    expect(joined).toContain('fetch, context7');
    expect(joined).toContain('Tool Policy:codex:browser-verification');
    expect(joined).toContain('playwright-mcp');
    expect(joined).toContain('Host Capability:gemini');
  });

  it('should provide host-specific remediation for planned gemini and cursor support', () => {
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
    expect(joined).toContain('Host Capability:gemini');
    expect(joined).toContain('Host Capability:cursor');
    expect(joined).toContain('spec-first update --host gemini');
    expect(joined).toContain('spec-first update --host cursor');
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

  it('should report background input, runtime health, and docs output checks', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '05_verify', backgroundInputStatus: 'degraded' }),
      'utf-8',
    );
    mkdirSync(join(TMP, '.spec-first', 'runtime', 'first'), { recursive: true });
    mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
    writeFileSync(join(TMP, 'docs', 'first', 'summary.md'), '# Summary\n', 'utf-8');
    writeFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'index.json'),
      JSON.stringify({
        version: '1.0.0',
        lastRun: '2026-03-08T12:00:00.000Z',
        mode: 'deep',
        summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        apiContracts: { path: '.spec-first/runtime/first/api-contracts.json', fileHash: 'api-contracts', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: false, issues: ['hash mismatch'] },
        structureOverview: { path: '.spec-first/runtime/first/structure-overview.json', fileHash: 'structure-overview', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        domainModel: { path: '.spec-first/runtime/first/domain-model.json', fileHash: 'domain-model', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        databaseSchema: { path: '.spec-first/runtime/first/database-schema.json', fileHash: 'database-schema', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true, status: 'healthy' },
        docsProjection: {},
        status: 'stale',
        staleReason: 'docs outputs missing',
      }),
      'utf-8',
    );

    const lines = [];
    const originalLog = console.log;
    console.log = (...args) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };
    try {
      withCwd(TMP, () => handleDoctor([FEAT]));
    } finally {
      console.log = originalLog;
    }

    const joined = lines.join('\n');
    expect(joined).toContain('Background Input');
    expect(joined).toContain('degraded');
    expect(joined).toContain('First Runtime Assets');
    expect(joined).toContain('hash mismatch');
    expect(joined).toContain('Docs Outputs');
    expect(joined).toContain('缺失');
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
