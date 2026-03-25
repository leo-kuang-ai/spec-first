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

function createProfile() {
  return {
    name: 'frontend-design',
    description: 'Frontend design guidance',
    sourcePath: FRONTEND_SOURCE,
    commands: ['/spec-first:frontend-design'],
    frontmatter: {},
    concepts: [],
    practices: [],
    caveats: [],
    examples: [],
    tools: [],
    keywords: ['frontend', 'design', 'ui'],
    primaryStage: 'design' as const,
    relatedStages: ['code' as const],
    parserWarnings: [],
    suggestedCategory: 'frontend' as const,
  };
}

describe('buildIntegrationPlan', () => {
  it('forces report-only mode when requested', () => {
    const plan = buildIntegrationPlan({
      projectRoot: TMP,
      skillName: 'frontend-design',
      source: {
        requestedName: 'frontend-design',
        resolvedName: 'frontend-design',
        sourcePath: FRONTEND_SOURCE,
        sourceType: 'local-directory',
        skillMdPath: join(FRONTEND_SOURCE, 'SKILL.md'),
      },
      profile: createProfile(),
      target: 'guideline',
      reportOnly: true,
    });

    expect(plan.mode).toBe('report-only');
    expect(plan.fileWrites).toHaveLength(1);
    expect(plan.fileWrites[0].kind).toBe('report');
    expect(plan.fileWrites[0].overwrite).toBe(true);
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
          requestedName: 'frontend-design',
          resolvedName: 'frontend-design',
          sourcePath: FRONTEND_SOURCE,
          sourceType: 'local-directory',
          skillMdPath: join(FRONTEND_SOURCE, 'SKILL.md'),
        },
        profile: {
          ...createProfile(),
          keywords: ['frontend', 'design'],
        },
        target: 'draft',
        reportOnly: true,
      })
    ).toThrow(/INTEGRATE_SKILL_CONFLICT/);
  });
});
