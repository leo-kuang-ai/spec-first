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
  writeFirstChangeMap,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';
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
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, 'skills', 'spec-first', '07-code'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

function writeSupplementalFirstAssets(projectRoot: string): void {
  writeFirstSteering(projectRoot, {
    product: { overview: 'skill runtime tests', coreScenarios: ['planning'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['TypeScript'], constraints: ['strict'], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['skill-runtime'], boundaries: ['src/cli'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(projectRoot, {
    api: { observedPatterns: ['spec-first CLI'], deviations: [], recommendedConvention: 'Keep CLI verbs stable.', evidence: ['src/cli'] },
    module: { observedPatterns: ['skill-runtime'], deviations: [], recommendedConvention: 'Keep runtime logic under src/core.', evidence: ['src/core'] },
    testing: { observedPatterns: ['Vitest'], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['tests/unit'] },
    projectRules: { observedPatterns: ['runtime truth first'], deviations: [], recommendedConvention: 'Read runtime truth first.', evidence: ['.spec-first/runtime/first'] },
  });
  writeFirstCriticalFlows(projectRoot, [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: ['src/cli/index.ts'],
      coreModules: ['skill-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstChangeMap(projectRoot, [
    {
      changeType: 'runtime-asset-extension',
      likelyModules: ['skill-runtime'],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: ['package.json'],
      likelyTests: ['tests/unit/skill-runtime.test.ts'],
      riskPoints: ['runtime index drift'],
    },
  ]);
  writeFirstEntryGuide(projectRoot, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/README.md'],
      relatedFlows: ['flow-cli-entry'],
    },
  ]);
  writeFirstRebootGuide(projectRoot, {
    projectWhat: 'skill runtime tests',
    whereToStart: ['.spec-first/runtime/first/summary.json'],
    currentCriticalAreas: ['runtime truth first'],
    commonChangePaths: ['src/core/skill-runtime'],
    verifyChecklist: ['pnpm vitest'],
  });
}

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

  it('should default review layer to cross when --layer is omitted', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '08-review'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '08-review', 'SKILL.md'), '# Review');
    const result = dispatchCommand('review', TMP);
    expect(result.route).toBe('skill');
    expect(result.args).toEqual(['--layer', 'cross']);
  });

  it('should default verify layer to completion when --layer is omitted', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '12-verify'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '12-verify', 'SKILL.md'), '# Verify');
    const result = dispatchCommand('verify', TMP);
    expect(result.route).toBe('skill');
    expect(result.args).toEqual(['--layer', 'completion']);
  });

  it('should reject review with invalid layer value', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '08-review'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '08-review', 'SKILL.md'), '# Review');
    const result = dispatchCommand('review --layer bad', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('Invalid --layer');
  });

  it('should reject verify with non-completion layer', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '12-verify'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '12-verify', 'SKILL.md'), '# Verify');
    const result = dispatchCommand('verify --layer single', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('Allowed: completion');
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

  it('should attach orchestrate background guidance from current feature state', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    mkdirSync(join(TMP, '.spec-first'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n');
    mkdirSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'), JSON.stringify({
      featureId: 'FSREQ-20260308-AUTH-001',
      currentStage: '02_design',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'blind',
      createdAt: '2026-03-08T12:00:00.000Z',
      updatedAt: '2026-03-08T12:00:00.000Z'
    }), 'utf-8');

    const result = dispatchCommand('orchestrate --auto', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateBackgroundGuidance).toEqual({
      backgroundStatus: 'blind',
      dependencyStrength: 'L2',
      warning: '缺少足够背景输入，建议先执行 /spec-first:first 补齐 runtime 真源',
      recommendedAction: 'backfill-first',
    });
  });


  it('should upgrade orchestrate dependency strength to L3 when implementation stage has high-risk signals', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    mkdirSync(join(TMP, '.spec-first'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n');
    mkdirSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'), JSON.stringify({
      featureId: 'FSREQ-20260308-AUTH-001',
      currentStage: '04_implement',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'degraded',
      createdAt: '2026-03-08T12:00:00.000Z',
      updatedAt: '2026-03-08T12:00:00.000Z'
    }), 'utf-8');
    writeFileSync(
      join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'task_plan.md'),
      '# Task Plan\n\n- [parallel] TASK-AUTH-001 风险改造\n',
      'utf-8',
    );

    const result = dispatchCommand('orchestrate --auto', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateBackgroundGuidance).toEqual({
      backgroundStatus: 'degraded',
      dependencyStrength: 'L3',
      riskSignals: ['存在并行任务标记'],
      riskCategory: 'high-risk-implementation',
      warning: '背景输入不完整，且当前属于高风险改动门槛，并存在高风险信号（存在并行任务标记），建议显式评估风险后再继续当前阶段',
      recommendedAction: 'review-risk',
    });
  });


  it('should tag design-stage L3 as formal-design-review', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    mkdirSync(join(TMP, '.spec-first'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n');
    mkdirSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'), JSON.stringify({
      featureId: 'FSREQ-20260308-AUTH-001',
      currentStage: '02_design',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'degraded',
      createdAt: '2026-03-08T12:00:00.000Z',
      updatedAt: '2026-03-08T12:00:00.000Z'
    }), 'utf-8');
    writeFileSync(
      join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'task_plan.md'),
      '# Task Plan\n\n- [parallel] TASK-AUTH-001 设计评审准备\n',
      'utf-8',
    );

    const result = dispatchCommand('orchestrate --auto', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateBackgroundGuidance).toEqual({
      backgroundStatus: 'degraded',
      dependencyStrength: 'L3',
      riskSignals: ['存在并行任务标记'],
      riskCategory: 'formal-design-review',
      warning: '背景输入不完整，且当前属于正式设计评审门槛，并存在高风险信号（存在并行任务标记），建议显式评估风险后再继续当前阶段',
      recommendedAction: 'review-risk',
    });
  });

  it('should tag verify-stage L3 as pre-release-verification', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md'), '# Orchestrate');
    mkdirSync(join(TMP, '.spec-first'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), 'FSREQ-20260308-AUTH-001\n');
    mkdirSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001'), { recursive: true });
    writeFileSync(join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'stage-state.json'), JSON.stringify({
      featureId: 'FSREQ-20260308-AUTH-001',
      currentStage: '05_verify',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'degraded',
      createdAt: '2026-03-08T12:00:00.000Z',
      updatedAt: '2026-03-08T12:00:00.000Z'
    }), 'utf-8');
    writeFileSync(
      join(TMP, 'specs', 'FSREQ-20260308-AUTH-001', 'task_plan.md'),
      '# Task Plan\n\n- [parallel] TASK-AUTH-001 上线前验证\n',
      'utf-8',
    );

    const result = dispatchCommand('orchestrate --auto', TMP);
    expect(result.route).toBe('skill');
    expect(result.orchestrateBackgroundGuidance).toEqual({
      backgroundStatus: 'degraded',
      dependencyStrength: 'L3',
      riskSignals: ['存在并行任务标记'],
      riskCategory: 'pre-release-verification',
      warning: '背景输入不完整，且当前属于上线前 / 高风险验证门槛，并存在高风险信号（存在并行任务标记），建议显式评估风险后再继续当前阶段',
      recommendedAction: 'review-risk',
    });
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

  // ─── First 参数校验集成 (B5) ─────────────────────────

  it('should dispatch first --force with parsed firstArgs', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '00-first'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '00-first', 'SKILL.md'), '# First');
    const result = dispatchCommand('first --force', TMP);
    expect(result.route).toBe('skill');
    expect(result.firstArgs).toBeDefined();
    expect(result.firstArgs!.mode).toBe('deep');
    expect(result.firstConfirmPolicy).toBe('skip');
    expect(result.firstModePolicy).toBe('manual');
  });

  it('should reject legacy first --quick flag', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '00-first'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '00-first', 'SKILL.md'), '# First');
    const result = dispatchCommand('first --quick --force', TMP);
    expect(result.route).toBe('error');
    expect(result.error).toContain('未知参数: --quick');
  });

  it('should reject first with unknown flag', () => {
    mkdirSync(join(TMP, 'skills', 'spec-first', '00-first'), { recursive: true });
    writeFileSync(join(TMP, 'skills', 'spec-first', '00-first', 'SKILL.md'), '# First');
    const result = dispatchCommand('first --verbose', TMP);
    expect(result.route).toBe('error');
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
  it('should throw when code hard-gate is BLOCKED', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, '# Code Skill', 'utf-8');

    expect(() => loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false }))
      .toThrow(/HARD-GATE/);
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
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
        '',
      ].join('\n'),
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
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
        '',
      ].join('\n'),
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
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
        '',
      ].join('\n'),
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

  it('should prepend orchestrate background notice when guidance exists', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '13-orchestrate', 'SKILL.md');
    mkdirSync(join(TMP, 'skills', 'spec-first', '13-orchestrate'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        currentStage: '02_design',
        backgroundInputStatus: 'blind',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        createdAt: '2026-03-08T12:00:00.000Z',
        updatedAt: '2026-03-08T12:00:00.000Z'
      }),
      'utf-8',
    );
    writeFileSync(skillPath, '# Orchestrate Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('orchestrate-runtime-context');
    expect(content).toContain('background_status: blind');
    expect(content).toContain('recommended_action: backfill-first');
    expect(content).toContain('missing_required_assets: summary');
    expect(content).toContain('first_context_warning: required runtime assets unavailable: summary');
  });

  it('should inject task runtime context even when first runtime is unavailable', () => {
    const skillDir = join(TMP, 'skills', 'spec-first', '06-task');
    const skillPath = join(skillDir, 'SKILL.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        currentStage: '03_plan',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        createdAt: '2026-03-12T12:00:00.000Z',
        updatedAt: '2026-03-12T12:00:00.000Z',
      }),
      'utf-8',
    );
    writeFileSync(skillPath, '# Task Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('task-runtime-context');
    expect(content).toContain('backgroundInputStatus: blind');
    expect(content).toContain('required_assets: summary');
    expect(content).toContain('recommendation: 建议先运行 /spec-first:first 补全背景数据');
  });

  it('should prefer resolver truth over cached backgroundInputStatus in plan runtime notice', () => {
    const skillDir = join(TMP, 'skills', 'spec-first', '10-plan');
    const skillPath = join(skillDir, 'SKILL.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '03_plan',
        backgroundInputStatus: 'blind',
        history: [],
        terminal: false,
        mode: 'N',
        size: 'S',
        platforms: ['h5'],
        createdAt: '2026-03-12T12:00:00.000Z',
        updatedAt: '2026-03-12T12:00:00.000Z',
      }),
      'utf-8',
    );
    writeFirstRuntimeIndex(TMP, {
      version: '1.0.0',
      lastRun: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      summary: {
        path: '.spec-first/runtime/first/summary.json',
        fileHash: 'summary',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      roleViews: {
        path: '.spec-first/runtime/first/role-views.json',
        fileHash: 'roles',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      stageViews: {
        path: '.spec-first/runtime/first/stage-views.json',
        fileHash: 'stages',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      steering: {
        path: '.spec-first/runtime/first/steering.json',
        fileHash: 'steering',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      conventions: {
        path: '.spec-first/runtime/first/conventions.json',
        fileHash: 'conventions',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      criticalFlows: {
        path: '.spec-first/runtime/first/critical-flows.json',
        fileHash: 'critical-flows',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      changeMap: {
        path: '.spec-first/runtime/first/change-map.json',
        fileHash: 'change-map',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      entryGuide: {
        path: '.spec-first/runtime/first/entry-guide.json',
        fileHash: 'entry-guide',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      rebootGuide: {
        path: '.spec-first/runtime/first/reboot-guide.json',
        fileHash: 'reboot-guide',
        lastUpdated: '2026-03-12T12:00:00.000Z',
        healthy: true,
      },
      docsProjection: {},
      status: 'current',
    });
    writeFirstRuntimeSummary(TMP, {
      generatedAt: '2026-03-12T12:00:00.000Z',
      mode: 'quick',
      project: { name: 'spec-first', platformType: 'cli' },
      techStack: ['TypeScript'],
      modules: ['skill-runtime'],
      capabilities: [],
      entryPoints: [],
      dataModels: [],
      apiSurface: [],
      risks: [],
      evidence: [],
    });
    writeFirstRoleViews(TMP, {
      product: { role: 'product', summary: 'Product summary', focus: [], warnings: [] },
      dev: { role: 'dev', summary: 'Dev summary', focus: [], warnings: [] },
      qa: { role: 'qa', summary: 'QA summary', focus: [], warnings: [] },
      architect: { role: 'architect', summary: 'Architect summary', focus: [], warnings: [] },
    });
    writeFirstStageViews(TMP, {
      spec: {
        stage: 'spec',
        summary: 'Spec summary',
        businessCapabilities: [],
        coreEntities: [],
        dependencies: [],
        warnings: [],
      },
      design: {
        stage: 'design',
        summary: 'Design summary',
        moduleBoundaries: [],
        integrationPoints: [],
        technicalConstraints: [],
        risks: [],
      },
      code: {
        stage: 'code',
        summary: 'Code summary',
        entryPoints: [],
        likelyChangeAreas: [],
        changeHazards: [],
        verificationHooks: [],
      },
      verify: {
        stage: 'verify',
        summary: 'Verify summary',
        testFocus: [],
        riskAreas: [],
        validationHooks: [],
        releaseBlockers: [],
      },
    });
    writeSupplementalFirstAssets(TMP);
    writeFileSync(skillPath, '# Plan Skill', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('plan-runtime-context');
    expect(content).toContain('backgroundInputStatus: full');
    expect(content).not.toContain('backgroundInputStatus: blind');
    expect(content).toContain('changeTypes: runtime-asset-extension');
    expect(content).toContain('entryCategories: runtime-extension');
  });

  it('should throw when review hard-gate is BLOCKED by stage mismatch', () => {
    const skillDir = join(TMP, 'skills', 'spec-first', '08-review');
    const skillPath = join(skillDir, 'SKILL.md');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({ currentStage: '02_design' }),
      'utf-8',
    );
    writeFileSync(skillPath, '# Review', 'utf-8');

    expect(() => loadSkill(skillPath, { projectRoot: TMP }))
      .toThrow(/review/);
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
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
        '',
      ].join('\n'),
      'utf-8',
    );

    execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.name "test"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'README.md'), 'seed\n', 'utf-8');
    execSync('git -c core.hooksPath=/dev/null add README.md', { cwd: TMP, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', { cwd: TMP, stdio: 'ignore' });
    execSync('git checkout -b main || git checkout main', { cwd: TMP, stdio: 'ignore' });

    expect(() => loadSkill(skillPath, { projectRoot: TMP }))
      .toThrow(/WORKTREE-CONFIRMED/);
  });

  it('should block unstable template when kv_cache_hard_gate is enabled', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, 'Date={{DATE_ISO}}\nFeature={{FEATURE_ID}}', 'utf-8');
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  kv_cache_hard_gate: true\n',
      'utf-8',
    );

    expect(() => loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false }))
      .toThrow('KV-CACHE-HARD-GATE');
  });

  it('should only warn unstable template when kv_cache_hard_gate is disabled', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    writeFileSync(skillPath, 'Date={{DATE_ISO}}\nFeature={{FEATURE_ID}}', 'utf-8');
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
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/auth/login.test.ts',
        '- exit code: 1',
        '',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
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

    const content = loadSkill(skillPath, { enableAssembly: false });
    expect(content).toContain('## Next Steps（Required Handoff）');
    expect(content).toContain('下一条可执行命令');
  });

  it('should block code when changed files exceed task file list and code-view scope', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    mkdirSync(join(TMP, 'src'), { recursive: true });
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
      [
        '| Task ID | 标题 | 状态 |',
        '|---|---|---|',
        '| TASK-AUTH-001 | Login | in_progress |',
        '',
        '### TASK-AUTH-001 — Login',
        '',
        '**文件清单**：',
        '- Modify: `src/allowed.ts`',
        '- Reference: `tests/unit/allowed.test.ts`',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/unit/auth.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
      ].join('\n'),
      'utf-8',
    );

    execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.name "test"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'README.md'), 'seed\n', 'utf-8');
    writeFileSync(join(TMP, 'src', 'allowed.ts'), 'export const allowed = true;\n', 'utf-8');
    writeFileSync(join(TMP, 'src', 'out-of-scope.ts'), 'export const other = true;\n', 'utf-8');
    execSync('git -c core.hooksPath=/dev/null add README.md src/allowed.ts src/out-of-scope.ts skills/spec-first/07-code/SKILL.md specs/FSREQ-20260211-AUTH-001/stage-state.json specs/FSREQ-20260211-AUTH-001/design.md', { cwd: TMP, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'src', 'out-of-scope.ts'), 'export const other = false;\n', 'utf-8');

    expect(() => loadSkill(skillPath, { projectRoot: TMP }))
      .toThrow(/SCOPE-GUARD-BLOCKED|out-of-scope\.ts/);
  });

  it('should allow code when changed files stay within task file list or code-view scope', () => {
    const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
    mkdirSync(join(TMP, 'src', 'feature'), { recursive: true });
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
      [
        '| Task ID | 标题 | 状态 |',
        '|---|---|---|',
        '| TASK-AUTH-001 | Login | in_progress |',
        '',
        '### TASK-AUTH-001 — Login',
        '',
        '**文件清单**：',
        '- Modify: `src/allowed.ts`',
      ].join('\n'),
      'utf-8',
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'findings.md'),
      [
        '# Findings',
        '',
        '## TDD Evidence',
        '- TASK: TASK-AUTH-001',
        '- TDD-RED',
        '- command: pnpm test -- tests/unit/auth.test.ts',
        '- exit code: 1',
        '- reason: function not implemented',
      ].join('\n'),
      'utf-8',
    );

    writeFirstRuntimeIndex(TMP, {
      version: '1.0.0',
      lastRun: '2026-03-09T00:00:00.000Z',
      mode: 'quick',
      summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'roles', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stages', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      steering: { path: '.spec-first/runtime/first/steering.json', fileHash: 'steering', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      conventions: { path: '.spec-first/runtime/first/conventions.json', fileHash: 'conventions', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      criticalFlows: { path: '.spec-first/runtime/first/critical-flows.json', fileHash: 'critical-flows', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      changeMap: { path: '.spec-first/runtime/first/change-map.json', fileHash: 'change-map', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      entryGuide: { path: '.spec-first/runtime/first/entry-guide.json', fileHash: 'entry-guide', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      rebootGuide: { path: '.spec-first/runtime/first/reboot-guide.json', fileHash: 'reboot-guide', lastUpdated: '2026-03-09T00:00:00.000Z', healthy: true },
      docsProjection: {},
      status: 'current',
    });
    writeFirstStageViews(TMP, {
      spec: { stage: 'spec', summary: 'spec', businessCapabilities: [], coreEntities: [], dependencies: [], warnings: [] },
      design: { stage: 'design', summary: 'design', moduleBoundaries: [], integrationPoints: [], technicalConstraints: [], risks: [] },
      code: {
        stage: 'code',
        summary: 'code',
        entryPoints: ['src/allowed.ts'],
        likelyChangeAreas: ['src/feature'],
        changeHazards: [],
        verificationHooks: [],
      },
      verify: { stage: 'verify', summary: 'verify', testFocus: [], riskAreas: [], validationHooks: [], releaseBlockers: [] },
    });
    writeSupplementalFirstAssets(TMP);

    execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.email "test@example.com"', { cwd: TMP, stdio: 'ignore' });
    execSync('git config user.name "test"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'README.md'), 'seed\n', 'utf-8');
    writeFileSync(join(TMP, 'src', 'allowed.ts'), 'export const allowed = true;\n', 'utf-8');
    writeFileSync(join(TMP, 'src', 'feature', 'helper.ts'), 'export const helper = true;\n', 'utf-8');
    execSync('git -c core.hooksPath=/dev/null add README.md src/allowed.ts src/feature/helper.ts skills/spec-first/07-code/SKILL.md specs/FSREQ-20260211-AUTH-001/stage-state.json specs/FSREQ-20260211-AUTH-001/design.md', { cwd: TMP, stdio: 'ignore' });
    execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', { cwd: TMP, stdio: 'ignore' });
    writeFileSync(join(TMP, 'src', 'feature', 'helper.ts'), 'export const helper = false;\n', 'utf-8');

    const content = loadSkill(skillPath, { projectRoot: TMP });
    expect(content).toContain('HARD-GATE 运行时检查（自动）');
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
