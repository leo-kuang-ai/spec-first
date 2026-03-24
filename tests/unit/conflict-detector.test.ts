import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectSkillIntegrationConflicts } from '../../src/core/skill-integration/conflict-detector.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-integrate-skill-conflicts');
const SKILLS_ROOT = join(TMP, 'skills');

beforeEach(() => {
  mkdirSync(join(SKILLS_ROOT, 'existing-design'), { recursive: true });
  mkdirSync(join(SKILLS_ROOT, 'existing-code'), { recursive: true });
  writeFileSync(
    join(SKILLS_ROOT, 'AGENTS.md'),
    '# Shared skill governance\n',
    'utf-8'
  );
  writeFileSync(
    join(SKILLS_ROOT, 'existing-design', 'SKILL.md'),
    '# Skill: existing-design\n\n- Command: `/spec-first:design`\n- Use when working on design work.\n',
    'utf-8'
  );
  writeFileSync(
    join(SKILLS_ROOT, 'existing-code', 'SKILL.md'),
    '# Skill: existing-code\n\n- Command: `/spec-first:code`\n- Use when implementing code.\n',
    'utf-8'
  );
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('detectSkillIntegrationConflicts', () => {
  it('detects name conflicts against existing skills', () => {
    const conflicts = detectSkillIntegrationConflicts({
      projectRoot: TMP,
      skillName: 'existing-design',
      profile: {
        name: 'existing-design',
        category: 'frontend',
        primaryStage: 'design',
        relatedStages: ['code'],
        keywords: ['frontend', 'design'],
        commands: ['/spec-first:existing-design'],
      },
    });

    expect(conflicts.some((item) => item.type === 'name-conflict')).toBe(true);
  });

  it('detects capability overlap with stage-bound skills', () => {
    const conflicts = detectSkillIntegrationConflicts({
      projectRoot: TMP,
      skillName: 'frontend-design-plus',
      profile: {
        name: 'frontend-design-plus',
        category: 'frontend',
        primaryStage: 'design',
        relatedStages: ['code'],
        keywords: ['frontend', 'design', 'layout', 'component'],
        commands: ['/spec-first:frontend-design-plus'],
      },
    });

    expect(conflicts.some((item) => item.type === 'capability-overlap')).toBe(true);
  });

  it('detects unsupported tech stacks as mismatch', () => {
    const conflicts = detectSkillIntegrationConflicts({
      projectRoot: TMP,
      skillName: 'rusty-skill',
      profile: {
        name: 'rusty-skill',
        category: 'generic',
        primaryStage: 'none',
        relatedStages: [],
        keywords: ['rust', 'python', 'go'],
        commands: ['/spec-first:rusty-skill'],
      },
    });

    expect(conflicts.some((item) => item.type === 'tech-stack-mismatch')).toBe(true);
  });
});

