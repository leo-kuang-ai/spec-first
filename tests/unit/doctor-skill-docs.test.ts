import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCTOR_ROOT = join(import.meta.dirname, '../../skills/spec-first/15-doctor');
const SKILL_MD = join(DOCTOR_ROOT, 'SKILL.md');
const RULES = join(DOCTOR_ROOT, 'references/diagnostic-rules.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('15-doctor skill docs consistency', () => {
  it('should diagnose canonical runtime assets and docs outputs', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(RULES)).toBe(true);

    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('canonical 资产健康状态');
    expect(skill).toContain('docs 输出');
    expect(rules).toContain('runtime 真源');
    expect(rules).toContain('docs 输出是否缺失');
  });

  it('should include background checks in doctor guidance', () => {
    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('background_input_status');
    expect(rules).toContain('background checks');
    expect(rules).toContain('runtime 真源');
  });

  it('should describe dry-run as the default and --fix as explicit apply mode', () => {
    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('默认以 dry-run');
    expect(skill).toContain('spec-first doctor --fix --yes');
    expect(rules).toContain('doctor --fix --yes');
  });

});
