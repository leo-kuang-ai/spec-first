/**
 * Skill Runtime 单元测试
 * Dispatcher + Phase Machine + confirm_policy
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { dispatchCommand, loadSkill, resolveSkillPath } from '../../src/core/skill-runtime/dispatcher.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';
import {
  createPhaseState, canTransition, transition, confirmPhase,
  preWriteArchive, getValidTransitions,
} from '../../src/core/skill-runtime/phase-machine.js';
import { evaluatePolicy, writeAutoAudit } from '../../src/core/skill-runtime/confirm-policy.js';
import type { Phase } from '../../src/core/skill-runtime/phase-machine.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-skill-runtime');
const FEAT = 'FSREQ-20260211-AUTH-001';

beforeEach(() => {
  resetConfigCache();
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  mkdirSync(join(TMP, 'skills', 'spec-first', '07-code'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

// ─── Dispatcher Tests ───────────────────────────────────

describe('dispatchCommand', () => {
  it('should dispatch runtime command', () => {
    const result = dispatchCommand('rfc list', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('rfc');
    expect(result.args).toEqual(['list']);
  });

  it('should dispatch with namespace prefix', () => {
    const result = dispatchCommand('spec-first:matrix check', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('matrix');
  });

  it('should map semantic subcommand', () => {
    const result = dispatchCommand('rfc approve RFC-001', TMP);
    expect(result.route).toBe('runtime');
    expect(result.command).toBe('rfc');
    expect(result.args).toContain('approved');
  });

  it('should dispatch to skill route', () => {
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
      'utf-8',
    );
    writeFileSync(join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md'), '# Code Skill');
    const result = dispatchCommand('code', TMP);
    expect(result.route).toBe('skill');
    expect(result.skillName).toBe('code');
    expect(result.skillPath).toBeDefined();
  });

  it('should not hard-block code skill at dispatch layer when prerequisites are missing', () => {
    writeFileSync(join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md'), '# Code Skill');
    const result = dispatchCommand('code', TMP);
    expect(result.route).toBe('skill');
  });

  it('should not hard-block design skill at dispatch layer on stage mismatch', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '04-design'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '04-design', 'SKILL.md'), '# Design Skill');
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );

    const result = dispatchCommand('design', TMP);
    expect(result.route).toBe('skill');
  });

  it('should return error for unknown command', () => {
    const result = dispatchCommand('nonexistent', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('SKILL_NOT_FOUND');
  });

  it('should return error for empty command', () => {
    const result = dispatchCommand(':', TMP);
    expect(result.route).toBe('error');
  });

  // ─── Orchestrate 参数校验集成 ─────────────────────────

  it('should dispatch orchestrate --auto with parsed args', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    const result = dispatchCommand('orchestrate --auto', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateArgs).toEqual({ mode: 'auto', resume: false });
  });

  it('should dispatch orchestrate --auto --resume with parsed args', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    const result = dispatchCommand('orchestrate --auto --resume', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateArgs).toEqual({ mode: 'auto', resume: true });
  });

  it('should reject orchestrate with unknown flag', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    const result = dispatchCommand('orchestrate --verbose', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('Unknown orchestrate flag');
  });

  it('should reject orchestrate --resume without --auto', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    const result = dispatchCommand('orchestrate --resume', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('--resume requires --auto');
  });

  it('should resolve namespaced extension skill route', () => {
    const extDir = join(TMP, '.spec-first', 'extensions', 'qa-pack');
    mkdirSync(join(extDir, 'skills', 'review'), { recursive: true });
    writeFileSync(join(extDir, 'extension.yaml'), 'namespace: qa\nversion: 1.0.0\nenabled: true\n', 'utf-8');
    writeFileSync(join(extDir, 'skills', 'review', 'SKILL.md'), '# QA Review Skill\n', 'utf-8');

    const result = dispatchCommand('ext.qa.review', TMP);
    expect(result.route).toBe('skill');
    expect(result.skillPath).toContain('.spec-first/extensions/qa-pack');
  });
});

describe('loadSkill hard-gate notice', () => {
  it('should inject BLOCKED hard-gate notice for code when prerequisites are missing', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false });
    expect(content).toContain('HARD-GATE 运行时检查（自动）');
    expect(content).toContain('检查结果: BLOCKED');
    expect(content).toContain('禁止实施写入');
  });

  it('should inject PASS hard-gate notice for code when prerequisites are satisfied', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
      'utf-8',
    );
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('HARD-GATE 运行时检查（自动）');
    expect(content).toContain('检查结果: PASS');
  });

  it('should detect in_progress TASK without trailing table delimiter', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress\n',
      'utf-8',
    );
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('检查结果: PASS');
  });

  it('should detect in_progress TASK when Task ID column is not first', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| 标题 | 状态 | Task ID |\n|---|---|---|\n| Login | in_progress | TASK-AUTH-001 |\n',
      'utf-8',
    );
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('检查结果: PASS');
  });

  it('should allow orchestrate in non-implement stage when context exists', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md');
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '02_design' }),
      'utf-8',
    );
    writeFileSync(skillPath, '# Orchestrate Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('HARD-GATE 运行时检查（自动）');
    expect(content).toContain('检查结果: PASS');
  });

  it('should block high-risk code execution on protected branch without worktree confirmation', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, '# Code Skill', 'utf-8');
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '04_implement' }),
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login [P] | in_progress |\n',
      'utf-8',
    );

    execSync('git init', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.name "test"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'README.md'), 'seed\n', 'utf-8');
    execSync('git add README.md', { cwd: TMP, stdio: 'ignore' });
    execSync('git -c commit.gpgsign=false commit -m "seed"', { cwd: TMP, stdio: 'ignore' });
    execSync('git checkout -b main || git checkout main', { cwd: TMP, stdio: 'ignore' });

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('检查结果: BLOCKED');
    expect(content).toContain('WORKTREE-CONFIRMED');
  });

  it('should block unstable template when kv_cache_hard_gate is enabled', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, 'Date={{DATE_ISO}}\nFeature={{FEATURE_ID}}', 'utf-8');
    writeFileSync(
      join(TMP, '.spec-first', 'config.yaml'),
      'runtime:\n  kv_cache_hard_gate: true\n',
      'utf-8',
    );

    expect(() => loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false }))
      .toThrow('KV-CACHE-HARD-GATE');
  });

  it('should only warn unstable template when kv_cache_hard_gate is disabled', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, 'Date={{DATE_ISO}}\nFeature={{FEATURE_ID}}', 'utf-8');
    writeFileSync(
      join(TMP, '.spec-first', 'config.yaml'),
      'runtime:\n  kv_cache_hard_gate: false\n',
      'utf-8',
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const content = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false });
    expect(content).toContain('HARD-GATE 运行时检查（自动）');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('should append Next Steps handoff requirement when missing', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false });
    expect(content).toContain('## Next Steps（Required Handoff）');
    expect(content).toContain('下一条可执行命令');
  });
});

// ─── Phase Machine Tests ────────────────────────────────

describe('Phase Machine', () => {
  it('should create initial state at P0_LOCATE', () => {
    const state = createPhaseState();
    expect(state.current).toBe('P0_LOCATE');
    expect(state.revisionCount).toBe(0);
  });

  it('should allow legal transitions', () => {
    expect(canTransition('P0_LOCATE', 'P1_CONTEXT')).toBe(true);
    expect(canTransition('P1_CONTEXT', 'P2_GENERATE')).toBe(true);
    expect(canTransition('P3_CONFIRM', 'P2_GENERATE')).toBe(true);
    expect(canTransition('P3_CONFIRM', 'ABORTED')).toBe(true);
  });

  it('should block illegal transitions', () => {
    expect(canTransition('P0_LOCATE', 'P3_CONFIRM')).toBe(false);
    expect(canTransition('DONE', 'P0_LOCATE')).toBe(false);
    expect(canTransition('P2_GENERATE', 'P4_WRITE')).toBe(false);
  });

  it('should transition through full happy path', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = confirmPhase(state);
    state = transition(state, 'P4_WRITE');
    state = transition(state, 'P5_SIDE_EFFECT');
    state = transition(state, 'DONE');
    expect(state.current).toBe('DONE');
  });

  it('should block P3→P4 without confirmation', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    expect(() => transition(state, 'P4_WRITE')).toThrow('confirmationGuard');
  });

  it('should allow P3→P2 revision and increment counter', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = transition(state, 'P2_GENERATE');
    expect(state.revisionCount).toBe(1);
    expect(state.current).toBe('P2_GENERATE');
  });

  it('should trigger 3-strike escalation after 3 consecutive revisions', () => {
    let state = createPhaseState();
    state = transition(state, 'P1_CONTEXT');
    state = transition(state, 'P2_GENERATE');
    state = transition(state, 'P3_CONFIRM');
    state = transition(state, 'P2_GENERATE'); // 1
    state = transition(state, 'P3_CONFIRM');
    state = transition(state, 'P2_GENERATE'); // 2
    state = transition(state, 'P3_CONFIRM');

    expect(() => transition(state, 'P2_GENERATE')).toThrow('3-Strike triggered');
  });

  it('should throw on illegal transition', () => {
    const state = createPhaseState();
    expect(() => transition(state, 'P4_WRITE')).toThrow('Illegal transition');
  });

  it('should return valid transitions for each phase', () => {
    expect(getValidTransitions('P0_LOCATE')).toEqual(['P1_CONTEXT']);
    expect(getValidTransitions('DONE')).toEqual([]);
    expect(getValidTransitions('P3_CONFIRM')).toHaveLength(3);
  });

  it('should archive oversized runtime file and keep tail lines', () => {
    const findingsPath = join(TMP, 'specs', FEAT, 'findings.md');
    const lines = Array.from({ length: 550 }, (_, i) => `line-${i + 1}`).join('\n');
    writeFileSync(findingsPath, lines, 'utf-8');

    const archived = preWriteArchive(FEAT, TMP);
    expect(archived).toContain('findings.md');

    const kept = readFileSync(findingsPath, 'utf-8').split('\n');
    expect(kept.length).toBeLessThanOrEqual(200);
    expect(kept[0]).toBe('line-351');

    const files = readdirSync(join(TMP, 'specs', FEAT));
    expect(files.some((f) => /^findings-\d{4}-\d{2}-\d{2}-\d+\.md$/.test(f))).toBe(true);
  });

  it('should archive medium runtime file when risk markers exist', () => {
    const findingsPath = join(TMP, 'specs', FEAT, 'findings.md');
    const lines = Array.from({ length: 220 }, (_, i) => `line-${i + 1}`);
    lines[30] = '状态: PASS_WITH_WAIVER';
    writeFileSync(findingsPath, lines.join('\n'), 'utf-8');

    const archived = preWriteArchive(FEAT, TMP);
    expect(archived).toContain('findings.md');
  });
});

// ─── confirm_policy Tests ───────────────────────────────

describe('evaluatePolicy', () => {
  it('should return strict for mode N', () => {
    expect(evaluatePolicy({ mode: 'N', size: 'S', hasNfrSec: false, hasNewExternalApi: false })).toBe('strict');
  });

  it('should return auto for mode I + size S + no security', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: false, hasNewExternalApi: false })).toBe('auto');
  });

  it('should return strict for mode I + size S + has NFR-SEC', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: true, hasNewExternalApi: false })).toBe('strict');
  });

  it('should return strict for mode I + size S + new external API', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'S', hasNfrSec: false, hasNewExternalApi: true })).toBe('strict');
  });

  it('should return assisted for mode I + size M', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'M', hasNfrSec: false, hasNewExternalApi: false })).toBe('assisted');
  });

  it('should return assisted for mode I + size L', () => {
    expect(evaluatePolicy({ mode: 'I', size: 'L', hasNfrSec: true, hasNewExternalApi: true })).toBe('assisted');
  });
});
