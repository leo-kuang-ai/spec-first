import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleStage } from '../../src/cli/commands/stage.js';
import { handleDone } from '../../src/cli/commands/done.js';
import { writeFirstRuntimeIndex, writeFirstRuntimeSummary, writeFirstRoleViews, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';
import * as hostBootstrap from '../../src/shared/host-bootstrap.js';
import * as hostAdapterRegistry from '../../src/core/host-adapters/registry.js';
import * as skillCommands from '../../src/shared/skill-commands.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-cli-init-stage');

const origCwd = process.cwd;
const origSpecFirstSkillsDir = process.env.SPEC_FIRST_SKILLS_DIR;
const origInitBootstrap = process.env.SPEC_FIRST_INIT_BOOTSTRAP;


function seedHealthyRuntimeFirst(projectRoot: string): void {
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-08T12:00:00.000Z',
    mode: 'quick',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-08T12:00:00.000Z',
    mode: 'quick',
    project: { name: 'spec-first', platformType: 'backend', overview: 'runtime init' },
    modules: ['src/core/process-engine/init.ts'],
    capabilities: ['feature initialization'],
    entryPoints: ['src/cli/commands/init.ts'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init'],
    risks: [],
    evidence: [],
  });
  writeFirstRoleViews(projectRoot, {
    product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: ['validation'], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: ['entrypoints'], warnings: [] },
  });
  writeFirstStageViews(projectRoot, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['feature initialization'], coreEntities: ['Feature'], dependencies: ['spec-first init'], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/process-engine'], integrationPoints: ['src/cli/commands/init.ts'], technicalConstraints: ['runtime truth source'], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/commands/init.ts'], likelyChangeAreas: ['src/core/process-engine/init.ts'], changeHazards: [], verificationHooks: ['tests/unit/cli-init-stage.test.ts'] },
    verify: { stage: 'verify', summary: 'verify', testFocus: ['runtime readiness'], riskAreas: [], validationHooks: ['pnpm vitest run tests/unit/cli-init-stage.test.ts'], releaseBlockers: [] },
  });
}

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
  writeFileSync(join(TMP, 'docs', 'first', 'tech-stack.md'), '# Tech Stack\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'codebase-overview.md'), '# Codebase Overview\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'domain-model.md'), '# Domain Model\n', 'utf-8');
  writeFileSync(join(TMP, 'docs', 'first', 'api-docs.md'), '# API Docs\n', 'utf-8');
  seedHealthyRuntimeFirst(TMP);
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, '.host', 'spec-first-skills');
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (origSpecFirstSkillsDir === undefined) {
    delete process.env.SPEC_FIRST_SKILLS_DIR;
  } else {
    process.env.SPEC_FIRST_SKILLS_DIR = origSpecFirstSkillsDir;
  }
  if (origInitBootstrap === undefined) {
    delete process.env.SPEC_FIRST_INIT_BOOTSTRAP;
  } else {
    process.env.SPEC_FIRST_INIT_BOOTSTRAP = origInitBootstrap;
  }
  process.cwd = origCwd;
  vi.restoreAllMocks();
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

  it('should accept runtime first assets without docs first', async () => {
    rmSync(join(TMP, 'docs'), { recursive: true, force: true });

    writeFirstRuntimeIndex(TMP, {
      version: '1.0.0',
      lastRun: '2026-03-08T12:00:00.000Z',
      mode: 'quick',
      summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
      roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
      stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
      docsProjection: {},
      status: 'current',
    });
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'quick',
      project: { name: 'spec-first', platformType: 'backend', overview: 'runtime-only init' },
      modules: ['src/core/process-engine/init.ts'],
      capabilities: ['feature initialization'],
      entryPoints: ['src/cli/commands/init.ts'],
      dataModels: ['Feature'],
      apiSurface: ['spec-first init'],
      risks: ['legacy docs coupling'],
      evidence: ['src/cli/commands/init.ts'],
    });
    writeFirstRoleViews(TMP, {
      product: { role: 'product', summary: 'product', focus: ['capabilities'], warnings: [] },
      dev: { role: 'dev', summary: 'dev', focus: ['modules'], warnings: [] },
      qa: { role: 'qa', summary: 'qa', focus: ['risks'], warnings: [] },
      architect: { role: 'architect', summary: 'architect', focus: ['entrypoints'], warnings: [] },
    });
    writeFirstStageViews(TMP, {
      spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['feature initialization'], coreEntities: ['Feature'], dependencies: ['spec-first init'], warnings: [] },
      design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/process-engine'], integrationPoints: ['src/cli/commands/init.ts'], technicalConstraints: ['runtime truth source'], risks: [] },
      code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/commands/init.ts'], likelyChangeAreas: ['src/core/process-engine/init.ts'], changeHazards: ['legacy docs coupling'], verificationHooks: ['tests/unit/cli-init-stage.test.ts'] },
      verify: { stage: 'verify', summary: 'verify', testFocus: ['runtime readiness'], riskAreas: ['legacy docs coupling'], validationHooks: ['pnpm vitest run tests/unit/cli-init-stage.test.ts'], releaseBlockers: [] },
    });

    const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    expect(code).toBe(0);
  });

  it('should print background_input_status in init summary', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      rmSync(join(TMP, 'docs'), { recursive: true, force: true });
      writeFirstRuntimeIndex(TMP, {
        version: '1.0.0',
        lastRun: '2026-03-08T12:00:00.000Z',
        mode: 'quick',
        summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-08T12:00:00.000Z', healthy: true },
        docsProjection: {},
        status: 'current',
      });
      writeFirstRuntimeSummary(TMP, {
        generatedAt: '2026-03-08T12:00:00.000Z',
        mode: 'quick',
        project: { name: 'spec-first', platformType: 'backend', overview: 'runtime-only init' },
        modules: ['src/core/process-engine/init.ts'],
        capabilities: ['feature initialization'],
        entryPoints: ['src/cli/commands/init.ts'],
        dataModels: ['Feature'],
        apiSurface: ['spec-first init'],
        risks: [],
        evidence: [],
      });
      writeFirstRoleViews(TMP, {
        product: { role: 'product', summary: 'product', focus: [], warnings: [] },
        dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
        qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
        architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
      });
      writeFirstStageViews(TMP, {
        spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
        design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
        code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
        verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
      });

      const code = await handleInit(['--feat', 'AUTH', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

      expect(code).toBe(0);
      expect(output).toContain('background_input_status: full');
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
    rmSync(join(TMP, '.spec-first', 'runtime', 'first'), { recursive: true, force: true });
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

  it('should run bootstrap when --bootstrap is provided', async () => {
    const bootstrapSpy = vi
      .spyOn(hostBootstrap, 'ensureHostBootstrap')
      .mockReturnValue({ ok: true, results: [] });
    vi.spyOn(skillCommands, 'ensureSkillCommands').mockReturnValue({
      claude: [],
      codex: [],
      gemini: [],
      cursor: [],
      generic: [],
      codexWarnings: [],
    });

    const code = await handleInit([
      '--feat',
      'AUTH',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
      '--bootstrap',
    ]);

    expect(code).toBe(0);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
  });

  it('should print structured host status after successful bootstrap', async () => {
    vi.spyOn(hostBootstrap, 'ensureHostBootstrap').mockReturnValue({ ok: true, results: [] });
    vi.spyOn(hostAdapterRegistry, 'resolveHostAdapterStatuses').mockReturnValue([
      {
        id: 'claude',
        detected: true,
        summary: 'Claude detected',
        maturity: 'stable',
        remediation: '如需刷新 Claude 基线能力，运行 spec-first update --host claude',
        baselineState: 'ready',
        missingBaseline: [],
      },
      {
        id: 'gemini',
        detected: true,
        summary: 'Gemini CLI detected',
        maturity: 'experimental',
        remediation: '运行 spec-first update --host gemini',
        baselineState: 'partial',
        missingBaseline: ['skills', 'mcp'],
      },
    ]);
    vi.spyOn(skillCommands, 'ensureSkillCommands').mockReturnValue({
      claude: [],
      codex: [],
      gemini: [],
      cursor: [],
      generic: [],
      codexWarnings: [],
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const code = await handleInit([
        '--feat',
        'AUTH',
        '--mode',
        'N',
        '--size',
        'S',
        '--platforms',
        'h5',
        '--bootstrap',
      ]);

      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(0);
      expect(output).toContain('宿主基线状态：');
      expect(output).toContain('claude: detected, baseline=ready, missing=(none)');
      expect(output).not.toContain('宿主基线状态：\n  gemini: detected, baseline=partial, missing=skills+mcp');
      expect(output).toContain('实验宿主提示：');
      expect(output).toContain('gemini: detected, baseline=partial, missing=skills+mcp');
      expect(output).toContain('运行 spec-first update --host gemini');
      expect(output.indexOf('宿主基线状态：')).toBeGreaterThan(
        output.indexOf('AI Runtime Hooks 已注册')
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('should run bootstrap when SPEC_FIRST_INIT_BOOTSTRAP=1', async () => {
    process.env.SPEC_FIRST_INIT_BOOTSTRAP = '1';
    const bootstrapSpy = vi
      .spyOn(hostBootstrap, 'ensureHostBootstrap')
      .mockReturnValue({ ok: true, results: [] });
    vi.spyOn(skillCommands, 'ensureSkillCommands').mockReturnValue({
      claude: [],
      codex: [],
      gemini: [],
      cursor: [],
      generic: [],
      codexWarnings: [],
    });

    const code = await handleInit([
      '--feat',
      'AUTH',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
    ]);

    expect(code).toBe(0);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);
  });

  it('should stop init when bootstrap reports config errors', async () => {
    vi.spyOn(hostBootstrap, 'ensureHostBootstrap').mockReturnValue({
      ok: false,
      results: [
        {
          host: 'Claude Code',
          category: 'MCP',
          name: 'context7',
          level: 'ERROR',
          detail: 'missing context7 config',
        },
      ],
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const code = await handleInit([
      '--feat',
      'AUTH',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
      '--bootstrap',
    ]);

    expect(code).toBe(ExitCode.CONFIG_ERROR);
    expect(errSpy).toHaveBeenCalledWith(
      '[bootstrap] [Claude Code] MCP/context7: missing context7 config'
    );
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

  it('should reject legacy --force for stage advance', async () => {
    const fid = await setupFeature();
    const code = handleStage(['advance', fid, '--force']);
    expect(code).toBe(2);
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


  it('should include suggest in stage help output', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      const code = handleStage(['unknown']);
      const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
      expect(code).toBe(2);
      expect(output).toContain('suggest');
    } finally {
      logSpy.mockRestore();
    }
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


describe('handleDone', () => {
  async function setupReleasableFeature(): Promise<string> {
    await handleInit(['--feat', 'DON', '--mode', 'N', '--size', 'S', '--platforms', 'h5']);
    const entries = readdirSync(join(TMP, 'specs')).filter((e) => e.startsWith('FSREQ-'));
    const fid = entries.find((e) => e.includes('-DON-')) ?? entries[entries.length - 1];
    const featDir = join(TMP, 'specs', fid);
    writeFileSync(join(featDir, 'reports', 'smoke-test-report.md'), '# smoke\n', 'utf-8');
    writeFileSync(join(featDir, 'reports', 'release-note.md'), '# release\n', 'utf-8');
    writeFileSync(join(featDir, 'retro.md'), '# retro\n', 'utf-8');
    const state = JSON.parse(readFileSync(join(featDir, 'stage-state.json'), 'utf-8'));
    state.currentStage = '07_release';
    state.history = [];
    state.terminal = false;
    writeFileSync(join(featDir, 'stage-state.json'), JSON.stringify(state, null, 2));
    writeFileSync(
      join(featDir, 'gate-history.jsonl'),
      `${JSON.stringify({ event: 'gate_eval', stage: '07_release', status: 'PASS', conditions: [] })}\n`,
      'utf-8',
    );
    return fid;
  }

  it('should advance release feature to done via runtime alias', async () => {
    const fid = await setupReleasableFeature();
    const code = handleDone([fid]);
    expect(code).toBe(0);

    const state = JSON.parse(readFileSync(join(TMP, 'specs', fid, 'stage-state.json'), 'utf-8')) as { currentStage: string; terminal: boolean };
    expect(state.currentStage).toBe('08_done');
    expect(state.terminal).toBe(true);
  });
});
