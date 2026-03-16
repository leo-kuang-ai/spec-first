import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { handleFirst } from '../../src/cli/commands/first.js';
import { handleInit } from '../../src/cli/commands/init.js';
import { handleDone } from '../../src/cli/commands/done.js';
import { handleStage } from '../../src/cli/commands/stage.js';
import { Stage, type StageState } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-cli-real-flow');
const origCwd = process.cwd;
const origEnv = {
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
  VITEST: process.env.VITEST,
  NODE_ENV: process.env.NODE_ENV,
};

function seedProject(): void {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  mkdirSync(join(TMP, 'src', 'cli'), { recursive: true });
  mkdirSync(join(TMP, 'src', 'core', 'skill-runtime'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify(
      {
        name: 'first-cli-real-flow',
        version: '1.0.0',
        type: 'module',
        scripts: {
          'contract:check': 'echo ok',
        },
        bin: { 'spec-first': 'dist/cli/index.js' },
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { target: 'ES2022' } }, null, 2) + '\n',
    'utf-8'
  );
  writeFileSync(join(TMP, 'vitest.config.ts'), 'export default {}\n', 'utf-8');
  writeFileSync(join(TMP, 'src', 'cli', 'index.ts'), 'export const cli = true;\n', 'utf-8');
  writeFileSync(
    join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
    'export const marker = "baseline";\n',
    'utf-8'
  );

  mkdirSync(join(TMP, 'agents-home', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents-home', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents-home', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents-home', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');
}

function initRepo(): void {
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config core.hooksPath /dev/null', { cwd: TMP, stdio: 'ignore' });
  execSync('git config commit.gpgsign false', { cwd: TMP, stdio: 'ignore' });
}

function commitAll(message: string): void {
  execSync('git -c core.hooksPath=/dev/null add .', { cwd: TMP, stdio: 'ignore' });
  execSync(`git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "${message}"`, {
    cwd: TMP,
    stdio: 'ignore',
  });
}

function getFeatureId(): string {
  return readdirSync(join(TMP, 'specs')).find((entry) => entry.startsWith('FSREQ-')) ?? '';
}

function writeStageState(featureId: string, currentStage: Stage): void {
  const stagePath = join(TMP, 'specs', featureId, 'stage-state.json');
  const current = JSON.parse(readFileSync(stagePath, 'utf-8')) as StageState;
  const nextState: StageState = {
    ...current,
    currentStage,
    terminal: false,
    updatedAt: '2026-03-16T00:00:00.000Z',
  };
  writeFileSync(stagePath, JSON.stringify(nextState, null, 2) + '\n', 'utf-8');
}

function seedReleaseDeliverables(featureId: string): void {
  const specDir = join(TMP, 'specs', featureId);
  mkdirSync(join(specDir, 'reports'), { recursive: true });
  writeFileSync(join(specDir, 'findings.md'), '# Findings\n', 'utf-8');
  writeFileSync(join(specDir, 'spec.md'), '# Spec\n', 'utf-8');
  writeFileSync(join(specDir, 'retro.md'), '# Retro\n', 'utf-8');
  writeFileSync(join(specDir, 'reports', 'release-note.md'), '# Release\n', 'utf-8');
  writeFileSync(join(specDir, 'reports', 'smoke-test-report.md'), '# Smoke\n', 'utf-8');
  writeFileSync(
    join(specDir, 'traceability-matrix.md'),
    [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-CLI-001 | FR | CLI governance flow | Accepted |  | TASK-CLI-001,TC-UT-CLI-001 |',
      '| TASK-CLI-001 | TASK | Implement CLI governance | Accepted | FR-CLI-001 |  |',
      '| TC-UT-CLI-001 | TC | Verify CLI governance | Accepted | FR-CLI-001 |  |',
      '',
    ].join('\n'),
    'utf-8'
  );
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  seedProject();
  initRepo();
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
  process.env.NODE_ENV = 'development';
  delete process.env.VITEST;
  process.cwd = () => TMP;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  for (const [key, value] of Object.entries(origEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.restoreAllMocks();
});

describe('first cli real flow', () => {
  it('runs first -> init -> done and writes back runtime truth through CLI handlers', async () => {
    expect(handleFirst(['--quick'])).toBe(0);

    const initCode = await handleInit([
      '--feat',
      'FLOW',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
    ]);
    expect(initCode).toBe(0);

    const featureId = getFeatureId();
    expect(featureId).toMatch(/^FSREQ-/);
    seedReleaseDeliverables(featureId);
    commitAll('baseline');
    writeStageState(featureId, Stage.WRAP_UP);
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
      'export const marker = "changed";\n',
      'utf-8'
    );

    expect(handleStage(['advance', featureId])).toBe(0);

    const stageState = JSON.parse(
      readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')
    ) as StageState;
    expect(stageState.currentStage).toBe(Stage.DONE);
    expect(stageState.terminal).toBe(true);
    expect(readFileSync(join(TMP, '.spec-first', 'current'), 'utf-8')).toBe('');

    const updatesLog = readFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'project-cognition-updates.jsonl'),
      'utf-8'
    );
    expect(updatesLog).toContain('"decision":"must_update"');
    expect(updatesLog).toContain('"writebackMode":"refresh-all"');
    expect(updatesLog).toContain('"updateSource":"governance-wrap-up"');

    const findings = readFileSync(join(TMP, 'specs', featureId, 'findings.md'), 'utf-8');
    expect(findings).toContain('PROJECT_COGNITION_APPROVED: must_update');
  });

  it('runs done alias from release and reprojects docs drift through CLI handlers', async () => {
    expect(handleFirst(['--quick'])).toBe(0);

    const initCode = await handleInit([
      '--feat',
      'DONE',
      '--mode',
      'N',
      '--size',
      'S',
      '--platforms',
      'h5',
    ]);
    expect(initCode).toBe(0);

    const featureId = getFeatureId();
    seedReleaseDeliverables(featureId);
    commitAll('baseline');
    writeStageState(featureId, Stage.RELEASE);
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    expect(handleDone([featureId])).toBe(0);

    const readme = readFileSync(join(TMP, 'docs', 'first', 'README.md'), 'utf-8');
    expect(readme).not.toContain('Drifted README');
    expect(readme).toContain('Canonical Projection Docs');

    const stageState = JSON.parse(
      readFileSync(join(TMP, 'specs', featureId, 'stage-state.json'), 'utf-8')
    ) as StageState;
    expect(stageState.currentStage).toBe(Stage.DONE);

    const updatesLog = readFileSync(
      join(TMP, '.spec-first', 'runtime', 'first', 'project-cognition-updates.jsonl'),
      'utf-8'
    );
    expect(updatesLog).toContain('"decision":"should_update"');
    expect(updatesLog).toContain('"writebackMode":"refresh-docs-from-runtime"');
    expect(updatesLog).toContain('"updateSource":"governance-done"');
  });
});
