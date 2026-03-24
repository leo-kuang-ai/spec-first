import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ORCHESTRATE_ROOT = join(import.meta.dirname, '../../skills/13-orchestrate');
const SKILL_MD = join(ORCHESTRATE_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('13-orchestrate skill docs consistency', () => {
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

  it('should document release and done stages as runtime-route responsibilities', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('07_release / 08_done 责任说明');
    expect(skill).toContain('runtime route');
    expect(skill).toContain('golive');
    expect(skill).toContain('done');
  });
});
