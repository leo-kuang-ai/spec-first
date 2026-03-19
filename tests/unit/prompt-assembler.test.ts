import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assemblePrompt, resolvePromptAssemblyContext } from '../../src/core/skill-runtime/prompt-assembler.js';
import { loadSkill } from '../../src/core/skill-runtime/dispatcher.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-prompt-assembler');
const FEAT = 'FSREQ-20260226-AUTH-001';

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });

  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
  writeFileSync(
    join(TMP, '.spec-first', 'meta', 'config.yaml'),
    'context:\n  token_budget: 12000\nruntime:\n  max_iterations: 7\n  max_self_corrections: 4\n',
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({ currentStage: '04_implement' }),
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'specs', FEAT, 'task_plan.md'),
    '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | in_progress |\n',
    'utf-8',
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('prompt assembler', () => {
  it('should prepend SHARED.md when loading a spec-first skill', () => {
    const skillsRoot = join(TMP, 'skills', 'spec-first');
    const skillPath = join(skillsRoot, '00-first', 'SKILL.md');

    mkdirSync(join(skillsRoot, '00-first'), { recursive: true });
    writeFileSync(join(skillsRoot, 'SHARED.md'), '# Shared Rules\nshared-marker\n', 'utf-8');
    writeFileSync(skillPath, '# First Skill\nskill-marker\n', 'utf-8');

    const loaded = loadSkill(skillPath, { enableAssembly: false });
    expect(loaded).toContain('shared-marker');
    expect(loaded).toContain('skill-marker');
    expect(loaded.indexOf('shared-marker')).toBeLessThan(loaded.indexOf('skill-marker'));
  });

  it('should resolve assembly context from project files', () => {
    const ctx = resolvePromptAssemblyContext(TMP);
    expect(ctx.featureId).toBe(FEAT);
    expect(ctx.currentStage).toBe('04_implement');
    expect(ctx.currentTask).toBe('TASK-AUTH-001');
    expect(ctx.tokenBudget).toBe(12000);
    expect(ctx.maxIterations).toBe(7);
    expect(ctx.maxSelfCorrection).toBe(3); // min(max_self_corrections=4, max_retry_per_task=3)
  });

  it('should replace supported placeholders', () => {
    const out = assemblePrompt('feat={{FEATURE_ID}} stage={{CURRENT_STAGE}} task={{CURRENT_TASK}} max={{MAX_ITERATIONS}} self={{MAX_SELF_CORRECTION}}', {
      featureId: FEAT,
      currentStage: '04_implement',
      currentTask: 'TASK-AUTH-001',
      tokenBudget: 12000,
      maxIterations: 7,
      maxSelfCorrection: 4,
      dateIso: '2026-02-26T00:00:00.000Z',
    });

    expect(out).toContain(`feat=${FEAT}`);
    expect(out).toContain('stage=04_implement');
    expect(out).toContain('task=TASK-AUTH-001');
    expect(out).toContain('max=7');
    expect(out).toContain('self=4');
  });

  it('should assemble placeholders when loading skill with projectRoot', () => {
    const skillPath = join(TMP, 'SKILL.md');
    writeFileSync(skillPath, 'Feature={{FEATURE_ID}} Stage={{CURRENT_STAGE}}', 'utf-8');

    const loaded = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: true });
    expect(loaded).not.toContain('skill-files-context');
    expect(loaded).toContain(`Feature=${FEAT}`);
    expect(loaded).toContain('Stage=04_implement');
  });

  it('should resolve N/A when no in_progress task exists', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| Task ID | 标题 | 状态 |\n|---|---|---|\n| TASK-AUTH-001 | Login | complete |\n',
      'utf-8',
    );

    const ctx = resolvePromptAssemblyContext(TMP);
    expect(ctx.currentTask).toBe('N/A');
  });
});
