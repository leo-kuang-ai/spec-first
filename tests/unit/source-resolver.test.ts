import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { resolveExternalSkillSource } from '../../src/core/skill-integration/source-resolver.js';

const FIXTURES = join(import.meta.dirname, '../fixtures/external-skills');
const FRONTEND = join(FIXTURES, 'frontend-design');
const BROKEN = join(FIXTURES, 'broken-skill');
const MISSING = join(FIXTURES, 'missing-skill');

describe('resolveExternalSkillSource', () => {
  it('resolves a valid source directory with SKILL.md', () => {
    const result = resolveExternalSkillSource({
      skillName: 'frontend-design',
      source: FRONTEND,
      reportOnly: false,
      allowMissingSource: false,
    });

    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.source.skillMdPath).toContain('SKILL.md');
    expect(result.source.requestedName).toBe('frontend-design');
  });

  it('throws SOURCE_INVALID when source exists but SKILL.md is missing', () => {
    expect(() =>
      resolveExternalSkillSource({
        skillName: 'broken-skill',
        source: BROKEN,
        reportOnly: false,
        allowMissingSource: false,
      })
    ).toThrow(/SOURCE_INVALID/);
  });

  it('throws SOURCE_NOT_FOUND when source does not exist', () => {
    expect(() =>
      resolveExternalSkillSource({
        skillName: 'missing-skill',
        source: MISSING,
        reportOnly: false,
        allowMissingSource: false,
      })
    ).toThrow(/SOURCE_NOT_FOUND/);
  });

  it('allows a missing-source result only with reportOnly + allowMissingSource', () => {
    const result = resolveExternalSkillSource({
      skillName: 'missing-skill',
      source: MISSING,
      reportOnly: true,
      allowMissingSource: true,
    });

    expect(result.kind).toBe('missing');
    if (result.kind !== 'missing') return;
    expect(result.reason).toBe('source-not-found');
    expect(result.requestedName).toBe('missing-skill');
  });
});

