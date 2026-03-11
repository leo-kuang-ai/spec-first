import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ONBOARDING_ROOT = join(import.meta.dirname, '../../skills/spec-first/00-onboarding');
const SKILL_MD = join(ONBOARDING_ROOT, 'SKILL.md');
const SCENARIO_MAPPING = join(ONBOARDING_ROOT, 'references/scenario-mapping.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-onboarding skill docs consistency', () => {
  it('should prefer role-views when first runtime assets exist', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(SCENARIO_MAPPING)).toBe(true);

    const skill = read(SKILL_MD);
    const mapping = read(SCENARIO_MAPPING);

    // SKILL.md references role-views.json for normal mode
    expect(skill).toContain('role-views');
    expect(skill).toContain('.spec-first/runtime/first/role-views.json');
    // scenario-mapping.md documents the role-views strategy
    expect(mapping).toContain('role-views');
    expect(mapping).toContain('优先按角色裁剪');
  });

  it('should document degraded onboarding when first assets are missing', () => {
    const skill = read(SKILL_MD);
    const mapping = read(SCENARIO_MAPPING);

    // SKILL.md uses "降级模式" for degraded mode (no role-views)
    expect(skill).toContain('降级');
    expect(skill).toContain('模式');
    // scenario-mapping.md documents degraded mode with explicit "无 first 资产"
    expect(mapping).toContain('degraded');
    expect(mapping).toContain('无 first 资产');
  });
});
