import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TASK_ROOT = join(import.meta.dirname, '../../skills/spec-first/06-task');
const SKILL_MD = join(TASK_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('06-task skill docs consistency', () => {
  it('should document task breakdown background dependencies', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('spec.md');
    expect(skill).toContain('design.md');
    expect(skill).toContain('traceability-matrix.md');
    expect(skill).toContain('backgroundInputStatus');
  });

  it('should align task background naming with the shared contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/background-quality-contract.md');
    expect(skill).toContain('backgroundInputStatus');
    expect(skill).toContain('background_input_status');
    expect(skill).toContain('输入层');
  });
});
