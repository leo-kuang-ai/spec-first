import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFirstRuntimeIndex, writeFirstStageViews } from '../../src/core/skill-runtime/first-runtime-store.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-skill-render');
const FEATURE_ID = 'FSREQ-20260312-FIRST-001';
const EXPLICIT_FEATURE_ID = 'FSREQ-20260312-FIRST-002';

beforeEach(() => {
  mkdirSync(join(TMP, 'skills', 'spec-first', '01-spec'), { recursive: true });
  mkdirSync(join(TMP, 'skills', 'spec-first', '10-plan'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  mkdirSync(join(TMP, 'specs', EXPLICIT_FEATURE_ID), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });

  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEATURE_ID}\n`, 'utf-8');
  writeFileSync(
    join(TMP, 'skills', 'spec-first', '01-spec', 'SKILL.md'),
    '# Spec Skill\n\nOriginal spec body.\n',
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'skills', 'spec-first', '10-plan', 'SKILL.md'),
    '# Plan Skill\n\nOriginal plan body.\n',
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'specs', FEATURE_ID, 'stage-state.json'),
    JSON.stringify({
      featureId: FEATURE_ID,
      currentStage: '01_specify',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      createdAt: '2026-03-12T10:00:00.000Z',
      updatedAt: '2026-03-12T10:00:00.000Z',
    }),
    'utf-8',
  );
  writeFileSync(
    join(TMP, 'specs', EXPLICIT_FEATURE_ID, 'stage-state.json'),
    JSON.stringify({
      featureId: EXPLICIT_FEATURE_ID,
      currentStage: '02_design',
      history: [],
      terminal: false,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      backgroundInputStatus: 'degraded',
      createdAt: '2026-03-12T11:00:00.000Z',
      updatedAt: '2026-03-12T11:00:00.000Z',
    }),
    'utf-8',
  );

  writeFirstRuntimeIndex(TMP, {
    version: '1.0.0',
    lastRun: '2026-03-12T10:00:00.000Z',
    mode: 'quick',
    summary: {
      path: '.spec-first/runtime/first/summary.json',
      fileHash: 'summary',
      lastUpdated: '2026-03-12T10:00:00.000Z',
      healthy: true,
    },
    roleViews: {
      path: '.spec-first/runtime/first/role-views.json',
      fileHash: 'roles',
      lastUpdated: '2026-03-12T10:00:00.000Z',
      healthy: true,
    },
    stageViews: {
      path: '.spec-first/runtime/first/stage-views.json',
      fileHash: 'stages',
      lastUpdated: '2026-03-12T10:00:00.000Z',
      healthy: true,
    },
    docsProjection: {},
    status: 'current',
  });
  writeFirstStageViews(TMP, {
    spec: {
      stage: 'spec',
      summary: 'Spec summary from runtime',
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
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(TMP, { recursive: true, force: true });
});

describe('handleSkill render', () => {
  it('renders dynamic skill content for spec', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render', 'spec', '--feature', FEATURE_ID]);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(stdout).toHaveBeenCalledTimes(1);
    const rendered = stdout.mock.calls[0]?.[0];
    expect(rendered).toContain('<!-- spec-runtime-context -->');
    expect(rendered).toContain('spec_view_summary: Spec summary from runtime');
    expect(rendered).toContain('# Spec Skill');
    expect(rendered).toContain('Original spec body.');
  });

  it('prefers --feature over .spec-first/current when rendering plan context', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render', 'plan', '--feature', EXPLICIT_FEATURE_ID]);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    const rendered = stdout.mock.calls[0]?.[0];
    expect(rendered).toContain('<!-- plan-runtime-context -->');
    expect(rendered).toContain('dependencyStrength: L2');
    expect(rendered).not.toContain('dependencyStrength: L1');
  });

  it('infers feature id from --input when host passes raw user arguments', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill([
      'render',
      'plan',
      '--input',
      `please continue feature ${EXPLICIT_FEATURE_ID} in design stage`,
    ]);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    const rendered = stdout.mock.calls[0]?.[0];
    expect(rendered).toContain('dependencyStrength: L2');
    expect(rendered).not.toContain('dependencyStrength: L1');
  });

  it('treats empty --input as omitted instead of validation error', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render', 'spec', '--input', '']);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(stderr).not.toHaveBeenCalled();
  });

  it('returns validation error when skill name is missing', async () => {
    const { handleSkill } = await import('../../src/cli/commands/skill.js');
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'cwd').mockReturnValue(TMP);

    const exitCode = handleSkill(['render']);

    expect(exitCode).toBe(ExitCode.VALIDATION_ERROR);
    expect(stderr).toHaveBeenCalled();
  });
});
