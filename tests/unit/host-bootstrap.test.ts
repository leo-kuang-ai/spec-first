import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const TMP = join(process.cwd(), 'tests/fixtures/.tmp-host-bootstrap');

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(() => ''),
}));

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({
    homeDir: TMP,
    codexRoot: join(TMP, 'codex'),
    codexConfigPath: join(TMP, 'codex', 'config.toml'),
    codexSkillsDir: join(TMP, 'codex', 'skills'),
    codexSystemSkillsDir: join(TMP, 'codex', 'skills', '.system'),
    claudeHomeDir: join(TMP, 'claude-home'),
    claudeSkillsDir: join(TMP, 'claude-home', 'skills'),
    claudeCommandsDir: join(TMP, 'claude-home', 'commands'),
    claudeConfigDir: join(TMP, 'claude-config'),
    claudeConfigFiles: [
      join(TMP, 'claude-config', 'mcp.json'),
      join(TMP, 'claude-config', 'settings.json'),
    ],
    agentsSkillsDir: join(TMP, 'agents', 'skills'),
    genericHomeDir: join(TMP, 'generic'),
    genericSkillsDir: join(TMP, 'generic', 'skills'),
    specFirstSkillsDir: join(TMP, 'spec-first', 'skills'),
    bootstrapCacheDir: join(TMP, 'bootstrap-cache'),
  }),
}));

import { ensureHostBootstrap } from '../../src/shared/host-bootstrap.js';

const ORIGINAL_VITEST = process.env.VITEST;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_SKIP = process.env.SPEC_FIRST_SKIP_BOOTSTRAP;

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'agents', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');

  delete process.env.VITEST;
  process.env.NODE_ENV = 'development';
  delete process.env.SPEC_FIRST_SKIP_BOOTSTRAP;
  vi.mocked(execFileSync).mockClear();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (ORIGINAL_VITEST === undefined) delete process.env.VITEST;
  else process.env.VITEST = ORIGINAL_VITEST;
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_SKIP === undefined) delete process.env.SPEC_FIRST_SKIP_BOOTSTRAP;
  else process.env.SPEC_FIRST_SKIP_BOOTSTRAP = ORIGINAL_SKIP;
});

describe('ensureHostBootstrap', () => {
  it('should skip bootstrap when SPEC_FIRST_SKIP_BOOTSTRAP=1', () => {
    process.env.SPEC_FIRST_SKIP_BOOTSTRAP = '1';
    const result = ensureHostBootstrap();
    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('should evaluate host bootstrap in dry-run mode', () => {
    const result = ensureHostBootstrap({ dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.results.some((item) => item.category === 'MCP')).toBe(true);
    expect(result.results.some((item) => item.category === 'Skill')).toBe(true);
    expect(result.results.some((item) => item.category === 'Binary')).toBe(false);
    expect(vi.mocked(execFileSync).mock.calls.length).toBe(0);
  });

  it('should run binary checks only when checkBinaries=true', () => {
    const result = ensureHostBootstrap({ dryRun: true, checkBinaries: true });
    expect(result.ok).toBe(true);
    expect(result.results.some((item) => item.category === 'Binary')).toBe(true);
    expect(vi.mocked(execFileSync).mock.calls.length).toBeGreaterThan(0);
  });
});
