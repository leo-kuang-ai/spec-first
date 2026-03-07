import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname, '../../skills/spec-first');
const SKILL_DIRS = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d\d-/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

const STAGE_BOUND_SKILLS = new Map([
  ['03-spec', 'spec'],
  ['04-design', 'design'],
  ['05-research', 'research'],
  ['06-task', 'task'],
  ['07-code', 'code'],
  ['08-review', 'review'],
  ['10-archive', 'archive'],
  ['12-verify', 'verify'],
  ['20-spec-review', 'spec-review'],
]);

const HARD_GATE_STAGE_REQUIREMENTS = new Map([
  ['spec', '01_specify'],
  ['spec-review', '01_specify'],
  ['design', '02_design'],
  ['research', '02_design'],
  ['task', '03_plan'],
  ['code', '04_implement'],
  ['review', '04_implement'],
  ['verify', '05_verify'],
  ['archive', '06_wrap_up'],
]);

function readSkill(dir: string): string {
  return readFileSync(join(ROOT, dir, 'SKILL.md'), 'utf-8');
}

function collectLocalRefs(skillPath: string, content: string): string[] {
  return [...content.matchAll(/(?:\.\.\/[^\s`)'\"<>]+\.(?:md|ya?ml)|\.\/[^\s`)'\"<>]+\.(?:md|ya?ml)|references\/[^\s`)'\"<>]+\.(?:md|ya?ml))/g)]
    .map((match) => match[0].replace(/[),.]$/, ''))
    .filter((ref) => !ref.startsWith('http'));
}

describe('skill catalog governance', () => {
  it('should keep valid frontmatter for all formal spec-first skills', () => {
    for (const dir of SKILL_DIRS) {
      const content = readSkill(dir);
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatter, `${dir} should have YAML frontmatter`).toBeTruthy();
      const yaml = frontmatter?.[1] ?? '';
      expect(/name\s*:/.test(yaml), `${dir} should declare name`).toBe(true);
      expect(/description\s*:/.test(yaml), `${dir} should declare description`).toBe(true);
    }
  });

  it('should keep all referenced local skill files resolvable', () => {
    for (const dir of SKILL_DIRS) {
      const skillPath = join(ROOT, dir, 'SKILL.md');
      const content = readSkill(dir);
      const refs = collectLocalRefs(skillPath, content);
      for (const ref of refs) {
        const target = resolve(join(ROOT, dir), ref);
        expect(existsSync(target), `${dir} references missing file: ${ref}`).toBe(true);
      }
    }
  });

  it('should keep command declarations for user-invocable stage and orchestration skills', () => {
    const requiredCommands = [
      '01-init',
      '00-onboarding',
      '03-spec',
      '04-design',
      '05-research',
      '06-task',
      '07-code',
      '08-review',
      '10-archive',
      '11-plan',
      '12-verify',
      '13-orchestrate',
      '14-status',
      '15-doctor',
      '16-sync',
      '17-feature',
      '20-spec-review',
      '21-analyze',
    ];

    for (const dir of requiredCommands) {
      const content = readSkill(dir);
      expect(
        /- Command[:：]\s*`[^`]+`/.test(content) || /\*\*Command\*\*[:：]\s*`[^`]+`/.test(content),
        `${dir} should declare a command`,
      ).toBe(true);
    }
  });

  it('should keep stage-bound skills mapped into runtime hard-gates', () => {
    for (const [, skillName] of STAGE_BOUND_SKILLS) {
      expect(
        HARD_GATE_STAGE_REQUIREMENTS.has(skillName),
        `${skillName} should be protected by hard-gate`,
      ).toBe(true);
    }
  });

  it('should keep top-level version aligned with metadata.version when metadata exists', () => {
    for (const dir of SKILL_DIRS) {
      const content = readSkill(dir);
      const topLevelVersion = (content.match(/version:\s*\"?([0-9.]+)\"?/) || [])[1];
      const metadataVersion = (content.match(/metadata:\n(?:.*\n)*?\s+version:\s*\"([0-9.]+)\"/m) || [])[1];
      if (!topLevelVersion || !metadataVersion) continue;
      expect(metadataVersion, `${dir} metadata.version should match top-level version`).toBe(topLevelVersion);
    }
  });
});
