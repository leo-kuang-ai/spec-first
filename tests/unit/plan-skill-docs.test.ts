import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PLAN_ROOT = join(import.meta.dirname, '../../skills/11-plan');
const SKILL_MD = join(PLAN_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('11-plan skill docs consistency', () => {
  it('should align plan background naming with the shared contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/background-quality-contract.md');
    expect(skill).toContain('backgroundInputStatus');
    expect(skill).toContain('background_input_status');
    expect(skill).toContain('输入层');
  });

  it('should align plan governance naming with the orchestration contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/orchestration-governance-contract.md');
    expect(skill).toContain('dependencyStrength');
    expect(skill).toContain('riskCategory');
    expect(skill).toContain('riskSignals');
    expect(skill).toContain('输入层');
  });
});
