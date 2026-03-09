import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ORCHESTRATE_ROOT = join(import.meta.dirname, '../../skills/spec-first/13-orchestrate');
const SKILL_MD = join(ORCHESTRATE_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('13-orchestrate skill docs consistency', () => {
  it('should document orchestration governance fields', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('dependency_strength');
    expect(skill).toContain('risk_category');
    expect(skill).toContain('risk_signals');
    expect(skill).toContain('recommended_action');
  });

  it('should align orchestrate governance naming with the shared contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/orchestration-governance-contract.md');
    expect(skill).toContain('background_status');
    expect(skill).toContain('dependency_strength');
    expect(skill).toContain('risk_category');
    expect(skill).toContain('risk_signals');
    expect(skill).toContain('recommended_action');
    expect(skill).toContain('展示层');
  });
});
