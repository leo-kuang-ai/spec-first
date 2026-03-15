import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleInit } from '../../src/cli/commands/init.js';
import { resolveHostAdapterStatuses } from '../../src/core/host-adapters/registry.js';
import {
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-init-bootstrap');
const originalCwd = process.cwd;
const originalEnv = {
  HOME: process.env.HOME,
  AGENTS_HOME: process.env.AGENTS_HOME,
  CODEX_HOME: process.env.CODEX_HOME,
  CODEX_SKILLS_DIR: process.env.CODEX_SKILLS_DIR,
  SPEC_FIRST_SKILLS_DIR: process.env.SPEC_FIRST_SKILLS_DIR,
  CLAUDE_HOME: process.env.CLAUDE_HOME,
  CLAUDE_SKILLS_DIR: process.env.CLAUDE_SKILLS_DIR,
  CLAUDE_COMMANDS_DIR: process.env.CLAUDE_COMMANDS_DIR,
  CLAUDE_CODE_CONFIG_DIR: process.env.CLAUDE_CODE_CONFIG_DIR,
  CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
  GEMINI_HOME: process.env.GEMINI_HOME,
  GEMINI_CONFIG_DIR: process.env.GEMINI_CONFIG_DIR,
  CURSOR_HOME: process.env.CURSOR_HOME,
  CURSOR_CONFIG_DIR: process.env.CURSOR_CONFIG_DIR,
  VITEST: process.env.VITEST,
  NODE_ENV: process.env.NODE_ENV,
};

function seedRuntimeFirst(projectRoot: string): void {
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-15T00:00:00.000Z',
    mode: 'quick',
    summary: {
      path: '.spec-first/runtime/first/summary.json',
      fileHash: 'summary',
      lastUpdated: '2026-03-15T00:00:00.000Z',
      healthy: true,
    },
    roleViews: {
      path: '.spec-first/runtime/first/role-views.json',
      fileHash: 'roles',
      lastUpdated: '2026-03-15T00:00:00.000Z',
      healthy: true,
    },
    stageViews: {
      path: '.spec-first/runtime/first/stage-views.json',
      fileHash: 'stages',
      lastUpdated: '2026-03-15T00:00:00.000Z',
      healthy: true,
    },
    docsProjection: {},
    status: 'current',
  });
  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-15T00:00:00.000Z',
    mode: 'quick',
    project: { name: 'spec-first', platformType: 'backend', overview: 'bootstrap integration' },
    modules: ['src/cli/commands/init.ts'],
    capabilities: ['bootstrap'],
    entryPoints: ['spec-first init'],
    dataModels: ['Feature'],
    apiSurface: ['spec-first init --bootstrap'],
    risks: [],
    evidence: [],
  });
  writeFirstRoleViews(projectRoot, {
    product: { role: 'product', summary: 'product', focus: [], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: [], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: [], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: [], warnings: [] },
  });
  writeFirstStageViews(projectRoot, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: [], likelyChangeAreas: [], changeHazards: [], verificationHooks: [] },
    verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
  });
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
  mkdirSync(join(TMP, 'agents-home', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents-home', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents-home', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents-home', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');
  seedRuntimeFirst(TMP);

  process.env.HOME = join(TMP, 'home');
  process.env.AGENTS_HOME = join(TMP, 'agents-home');
  process.env.CODEX_HOME = join(TMP, 'home', '.codex');
  process.env.CODEX_SKILLS_DIR = join(TMP, 'home', '.codex', 'skills');
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, 'home', '.spec-first', 'skills');
  process.env.CLAUDE_HOME = join(TMP, 'home', '.claude');
  process.env.CLAUDE_SKILLS_DIR = join(TMP, 'home', '.claude', 'skills');
  process.env.CLAUDE_COMMANDS_DIR = join(TMP, 'home', '.claude', 'commands');
  process.env.CLAUDE_CODE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.CLAUDE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.GEMINI_HOME = join(TMP, 'home', '.gemini');
  process.env.GEMINI_CONFIG_DIR = join(TMP, 'home', '.gemini', 'config');
  process.env.CURSOR_HOME = join(TMP, 'home', '.cursor');
  process.env.CURSOR_CONFIG_DIR = join(TMP, 'home', '.cursor', 'config');
  delete process.env.VITEST;
  process.env.NODE_ENV = 'development';
  process.cwd = () => TMP;
});

afterEach(() => {
  process.cwd = originalCwd;
  rmSync(TMP, { recursive: true, force: true });
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('init bootstrap integration', () => {
  it('should initialize feature and install baseline host capabilities', async () => {
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
    expect(existsSync(join(TMP, 'home', '.codex', 'config.toml'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.codex', 'skills', 'find-skills'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.claude', 'skills', 'skill-creator'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.config', 'claude-code', 'mcp.json'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.spec-first', 'skills', 'spec-first'))).toBe(true);
    const codexConfig = readFileSync(join(TMP, 'home', '.codex', 'config.toml'), 'utf-8');
    const claudeMcp = readFileSync(join(TMP, 'home', '.config', 'claude-code', 'mcp.json'), 'utf-8');
    expect(codexConfig).toContain('[mcp_servers.context7]');
    expect(codexConfig).toContain('[mcp_servers.serena]');
    expect(claudeMcp).toContain('"context7"');
    expect(claudeMcp).toContain('"playwright-mcp"');
    expect(existsSync(join(TMP, 'home', '.claude', 'commands', 'spec-first'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.codex', 'skills', 'spec-first'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.gemini', 'settings.json'))).toBe(false);
    expect(existsSync(join(TMP, 'home', '.cursor', 'mcp.json'))).toBe(false);

    const hostStatuses = resolveHostAdapterStatuses();
    const claude = hostStatuses.find((entry) => entry.id === 'claude');
    const codex = hostStatuses.find((entry) => entry.id === 'codex');
    expect(claude?.baselineState).toBe('ready');
    expect(claude?.missingBaseline).toEqual([]);
    expect(codex?.baselineState).toBe('ready');
    expect(codex?.missingBaseline).toEqual([]);
  });
});
