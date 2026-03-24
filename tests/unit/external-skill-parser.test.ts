import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { resolveExternalSkillSource } from '../../src/core/skill-integration/source-resolver.js';
import { parseExternalSkill } from '../../src/core/skill-integration/external-skill-parser.js';

const FIXTURES = join(import.meta.dirname, '../fixtures/external-skills');

describe('parseExternalSkill', () => {
  it('parses frontmatter and command lines from a valid skill', () => {
    const resolved = resolveExternalSkillSource({
      skillName: 'frontend-design',
      source: join(FIXTURES, 'frontend-design'),
      reportOnly: false,
      allowMissingSource: false,
    });

    if (resolved.kind !== 'resolved') {
      throw new Error('expected resolved source');
    }

    const parsed = parseExternalSkill(resolved.source);

    expect(parsed.name).toBe('frontend-design');
    expect(parsed.description).toContain('Frontend UI and UX');
    expect(parsed.commands).toContain('/spec-first:frontend-design');
    expect(parsed.keywords).toContain('frontend');
    expect(parsed.parserWarnings).toEqual([]);
  });

  it('extracts backend-related signals from an MCP skill', () => {
    const resolved = resolveExternalSkillSource({
      skillName: 'mcp-builder',
      source: join(FIXTURES, 'mcp-builder'),
      reportOnly: false,
      allowMissingSource: false,
    });

    if (resolved.kind !== 'resolved') {
      throw new Error('expected resolved source');
    }

    const parsed = parseExternalSkill(resolved.source);

    expect(parsed.commands).toContain('/spec-first:mcp-builder');
    expect(parsed.keywords).toContain('mcp');
    expect(parsed.keywords).toContain('server');
  });

  it('returns warnings for an incomplete skill shape', () => {
    const result = parseExternalSkill({
      requestedName: 'malformed-skill',
      resolvedName: 'malformed-skill',
      sourcePath: join(FIXTURES, 'malformed-skill'),
      sourceType: 'local-directory',
      skillMdPath: join(FIXTURES, 'malformed-skill', 'SKILL.md'),
    });

    expect(result.parserWarnings.length).toBeGreaterThan(0);
  });
});
