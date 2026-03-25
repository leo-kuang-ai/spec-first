import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveExternalSkillSource } from '../../src/core/skill-integration/source-resolver.js';

const FIXTURES = join(import.meta.dirname, '../fixtures/external-skills');
const TMP = join(import.meta.dirname, '../fixtures/.tmp-source-resolver');
const FRONTEND = join(FIXTURES, 'frontend-design');
const BROKEN = join(FIXTURES, 'broken-skill');
const MISSING = join(FIXTURES, 'missing-skill');
const HOME_ROOT = join(TMP, 'home');
const SPEC_FIRST_ROOT = join(HOME_ROOT, '.spec-first', 'skills');

const origCwd = process.cwd;
const origHome = process.env.HOME;

beforeEach(() => {
  process.cwd = () => TMP;
  process.env.HOME = HOME_ROOT;
});

afterEach(() => {
  process.cwd = origCwd;
  if (origHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = origHome;
  }
  rmSync(TMP, { recursive: true, force: true });
});

describe('resolveExternalSkillSource', () => {
  it('resolves a valid source directory with SKILL.md', () => {
    const result = resolveExternalSkillSource({
      skillName: 'frontend-design',
      source: FRONTEND,
    });

    expect(result.kind).toBe('resolved');
    expect(result.source.skillMdPath).toContain('SKILL.md');
    expect(result.source.requestedName).toBe('frontend-design');
  });

  it('throws SOURCE_INVALID when source exists but SKILL.md is missing', () => {
    expect(() =>
      resolveExternalSkillSource({
        skillName: 'broken-skill',
        source: BROKEN,
      })
    ).toThrow(/SOURCE_INVALID/);
  });

  it('throws SOURCE_NOT_FOUND when source does not exist', () => {
    expect(() =>
      resolveExternalSkillSource({
        skillName: 'missing-skill',
        source: MISSING,
      })
    ).toThrow(/SOURCE_NOT_FOUND/);
  });

  it('resolves a same-name directory from the current working directory when source is omitted', () => {
    const sameNameDir = join(TMP, 'frontend-design');
    const sameNameSkillMd = join(sameNameDir, 'SKILL.md');
    mkdirSync(sameNameDir, { recursive: true });
    writeFileSync(
      sameNameSkillMd,
      `---
name: frontend-design
description: local cwd source
---

# Skill: frontend-design

- Command: \`/spec-first:frontend-design\`
`,
      'utf-8'
    );

    const result = resolveExternalSkillSource({
      skillName: 'frontend-design',
    });

    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.source.skillMdPath).toBe(sameNameSkillMd);
  });

  it('resolves an installed skill from ~/.spec-first/skills when source is omitted', () => {
    const skillDir = join(SPEC_FIRST_ROOT, 'mcp-builder');
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      join(skillDir, 'SKILL.md'),
      `---
name: mcp-builder
description: installed source
---

# Skill: mcp-builder

- Command: \`/spec-first:mcp-builder\`
`,
      'utf-8'
    );

    const result = resolveExternalSkillSource({
      skillName: 'mcp-builder',
    });

    expect(result.kind).toBe('resolved');
    if (result.kind !== 'resolved') return;
    expect(result.source.sourcePath).toBe(skillDir);
  });
});
