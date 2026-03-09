import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CATCHUP_ROOT = join(import.meta.dirname, '../../skills/spec-first/02-catchup');
const SKILL_MD = join(CATCHUP_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('02-catchup skill docs consistency', () => {
  it('should display background_input_status in the recovery report', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('background_input_status');
    expect(skill).toContain('恢复报告模板');
  });

  it('should align catchup display naming with the shared contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/background-quality-contract.md');
    expect(skill).toContain('background_input_status');
    expect(skill).toContain('展示层');
  });
});
