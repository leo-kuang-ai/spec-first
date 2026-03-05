import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleStage } from '../../src/cli/commands/stage.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-init-stage');

const origCwd = process.cwd;

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'docs', 'first'), { recursive: true });
  writeFileSync(
    join(TMP, '.spec-first', 'layer2', 'h5.yaml'),
    'platform: h5\n',
    'utf-8',
  );
  writeFileSync(
    join(TMP, '.spec-first', 'layer2', 'api.yaml'),
    'platform: api\n',
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'docs', 'first', '.index.yaml'),
    "version: 1.0.0\nlast_run: '2026-03-03T00:00:00.000Z'\nmode: quick\nproducts: {}\nstatus: current\n",
    'utf-8',
  );
  writeFileSync(join(TMP, 'docs', 'first', 'tech-stack.md'), '# Tech Stack\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'codebase-overview.md'), '# Codebase Overview\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'domain-model.md'), '# Domain Model\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'api-docs.md'), '# API Docs\n', 'utf-8');
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

  it('should print first-check success summary before init', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(0);
      expect(output).toContain('✅ 前置检查通过');
      expect(output).toContain('00-first Skill 已完成 (quick 模式)');
      expect(output).toContain('- 技术栈:');
      expect(output).toContain('- 代码量:');
      expect(output).toContain('- API 端点:');
      expect(output).toContain('继续初始化需求工作区...');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should create .claude/settings.json scaffold when missing', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(0);
    const settingsPath = join(TMP, '.claude', 'settings.json');
    expect(existsSync(settingsPath)).toBe(true);
    expect(readFileSync(settingsPath, 'utf-8')).toContain('"hooks"');
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

  it('should dedupe duplicate platforms from --platforms', async () => {
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5,h5']);
    expect(code).toBe(0);
    const specsDir = join(TMP, 'specs');
    const entries = readdirSync(specsDir).filter((e) => e.startsWith('FSREQ-'));
    const state = JSON.parse(
      readFileSync(join(specsDir, entries[0], 'stage-state.json'), 'utf-8'),
    ) as { platforms: string[] };
    expect(state.platforms).toEqual(['h5']);
  });

  it('should sort platforms and warn when duplicates are detected', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5,api,h5']);
    expect(code).toBe(0);
    const specsDir = join(TMP, 'specs');
    const entries = readdirSync(specsDir).filter((e) => e.startsWith('FSREQ-'));
    const state = JSON.parse(
      readFileSync(join(specsDir, entries[0], 'stage-state.json'), 'utf-8'),
    ) as { platforms: string[] };
    expect(state.platforms).toEqual(['api', 'h5']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('检测到重复 platforms'));
    warn.mockRestore();
  });

  it('should return VALIDATION_ERROR when no layer2 template exists', async () => {
    rmSync(join(TMP, '.spec-first', 'layer2'), { recursive: true, force: true });
    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(2);
  });

  it('should return VALIDATION_ERROR when 00-first artifacts are missing', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    rmSync(join(TMP, 'docs', 'first'), { recursive: true, force: true });
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
      const output = errSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(2);
      expect(output).toContain('⚠️  前置检查失败');
      expect(output).toContain('00-first Skill 尚未执行');
      expect(output).toContain('/spec-first:first --quick');
      expect(output).toContain('/spec-first:first --deep');
      expect(output).toContain('完成后再运行 /spec-first:init');
    } finally {
      errSpy.mockRestore();
    }
  });

  it('should auto create meta config and avoid scaffold warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
      const output = warnSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(0);
      expect(existsSync(join(TMP, '.spec-first', 'meta', 'config.yaml'))).toBe(true);
      expect(output).not.toContain('警告：检测到项目初始化文件不完整');
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('should warn when meta config auto-create fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeFileSync(join(TMP, '.spec-first', 'meta'), 'occupied', 'utf-8');
    try {
      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
      const output = warnSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(0);
      expect(output).toContain('无法创建 .spec-first/meta/config.yaml');
      expect(output).toContain('警告：检测到项目初始化文件不完整');
      expect(output).toContain('.spec-first/meta/config.yaml');
    } finally {
      warnSpy.mockRestore();
    }
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

  it('should detect registered AI hooks from nested claude settings', async () => {
    const fid = await setupFeature();
    const settingsPath = join(TMP, '.claude', 'settings.json');
    writeFileSync(settingsPath, `${JSON.stringify({
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: 'echo custom' }] },
          { hooks: [{ type: 'command', command: 'npx spec-first gate check "$FEAT"' }] },
        ],
        PostToolUse: [
          { hooks: [{ type: 'command', command: 'npx spec-first matrix check "$FEAT"' }] },
        ],
        Stop: [
          { hooks: [{ type: 'command', command: 'npx spec-first ai stats "$FEAT"' }] },
        ],
      },
    }, null, 2)}\n`, 'utf-8');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['current', fid]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('AI Hooks：');
      expect(output).toContain('已注册: PreToolUse, PostToolUse, Stop');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should ignore top-level legacy AI hooks without hooks wrapper', async () => {
    const fid = await setupFeature();
    const settingsPath = join(TMP, '.claude', 'settings.json');
    writeFileSync(settingsPath, `${JSON.stringify({
      PreToolUse: [{ hooks: [{ type: 'command', command: 'npx spec-first gate check "$FEAT"' }] }],
      PostToolUse: [{ hooks: [{ type: 'command', command: 'npx spec-first matrix check "$FEAT"' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'npx spec-first ai stats "$FEAT"' }] }],
    }, null, 2)}\n`, 'utf-8');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['current', fid]);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('AI Hooks：');
      expect(output).toContain('已注册: (无)');
    } finally {
      logSpy.mockRestore();
    }
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
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = handleStage(['current']);
    expect(code).toBe(2);  // ExitCode.VALIDATION_ERROR
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('stage current'));
    mockError.mockRestore();
  });

  it('should return error for advance with missing featureId', () => {
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = handleStage(['advance']);
    expect(code).toBe(2);  // ExitCode.VALIDATION_ERROR
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('stage advance'));
    mockError.mockRestore();
  });
});
