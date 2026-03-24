import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ONBOARDING_ROOT = join(import.meta.dirname, '../../skills/00-onboarding');
const SKILL_MD = join(ONBOARDING_ROOT, 'SKILL.md');
const SCENARIO_MAPPING = join(ONBOARDING_ROOT, 'references/scenario-mapping.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-onboarding skill docs consistency', () => {
  it('should use spec-first discovery naming and trigger-style description', () => {
    expect(existsSync(SKILL_MD)).toBe(true);

    const skill = read(SKILL_MD);

    expect(skill).toContain('name: "spec-first:onboarding"');
    expect(skill).toContain('description: "Use when');
  });

  it('should guide users to run first before personalized onboarding', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(SCENARIO_MAPPING)).toBe(true);

    const skill = read(SKILL_MD);
    const mapping = read(SCENARIO_MAPPING);

    expect(skill).toContain('/spec-first:first');
    expect(skill).toContain('summary / entry-guide');
    expect(mapping).toContain('first');
    expect(mapping).toContain('学习路径');
  });

  it('should document degraded onboarding when first assets are missing', () => {
    const skill = read(SKILL_MD);
    const mapping = read(SCENARIO_MAPPING);

    expect(skill).toContain('降级');
    expect(skill).toContain('通用推荐');
    expect(mapping).toContain('degraded');
    expect(mapping).toContain('无 first 资产');
  });
});
