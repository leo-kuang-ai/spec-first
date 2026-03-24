import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildIntegrationPlan } from '../../src/core/skill-integration/integration-planner.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-integrate-skill-plan');
const SKILLS_ROOT = join(TMP, 'skills');
const FRONTEND_SOURCE = join(import.meta.dirname, '../fixtures/external-skills/frontend-design');

beforeEach(() => {
  mkdirSync(SKILLS_ROOT, { recursive: true });
  writeFileSync(join(SKILLS_ROOT, 'AGENTS.md'), '# Shared skill governance\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('buildIntegrationPlan', () => {
  it('forces report-only mode when requested', () => {
    const plan = buildIntegrationPlan({
      projectRoot: TMP,
      skillName: 'frontend-design',
      source: {
        kind: 'resolved',
        source: {
          requestedName: 'frontend-design',
          resolvedName: 'frontend-design',
          sourcePath: FRONTEND_SOURCE,
          sourceType: 'local-directory',
          skillMdPath: join(FRONTEND_SOURCE, 'SKILL.md'),
        },
      },
      profile: {
        name: 'frontend-design',
        category: 'frontend',
        primaryStage: 'design',
        relatedStages: ['code'],
        keywords: ['frontend', 'design', 'ui'],
        commands: ['/spec-first:frontend-design'],
      },
      target: 'guideline',
      reportOnly: true,
      allowMissingSource: false,
    });

    expect(plan.mode).toBe('report-only');
    expect(plan.fileWrites).toHaveLength(1);
    expect(plan.fileWrites[0].kind).toBe('report');
  });

  it('throws when the source is missing and allowMissingSource is false', () => {
    expect(() =>
      buildIntegrationPlan({
        projectRoot: TMP,
        skillName: 'missing-skill',
        source: {
          kind: 'missing',
          requestedName: 'missing-skill',
          reason: 'source-not-found',
        },
        profile: undefined,
        target: 'guideline',
        reportOnly: false,
        allowMissingSource: false,
      })
    ).toThrow(/SOURCE_NOT_FOUND/);
  });

  it('throws when the target name conflicts and rename is missing', () => {
    mkdirSync(join(SKILLS_ROOT, 'frontend-design'), { recursive: true });
    writeFileSync(
      join(SKILLS_ROOT, 'frontend-design', 'SKILL.md'),
      '# Skill: frontend-design\n\n- Command: `/spec-first:frontend-design`\n',
      'utf-8'
    );

    expect(() =>
      buildIntegrationPlan({
        projectRoot: TMP,
        skillName: 'frontend-design',
        source: {
          kind: 'resolved',
          source: {
            requestedName: 'frontend-design',
            resolvedName: 'frontend-design',
            sourcePath: FRONTEND_SOURCE,
            sourceType: 'local-directory',
            skillMdPath: join(FRONTEND_SOURCE, 'SKILL.md'),
          },
        },
        profile: {
          name: 'frontend-design',
          category: 'frontend',
          primaryStage: 'design',
          relatedStages: ['code'],
          keywords: ['frontend', 'design'],
          commands: ['/spec-first:frontend-design'],
        },
        target: 'draft',
        reportOnly: true,
        allowMissingSource: false,
      })
    ).toThrow(/INTEGRATE_SKILL_CONFLICT/);
  });
});

