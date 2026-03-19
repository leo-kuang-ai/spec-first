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

  it('should declare catchup as routing control with explicit confirm policy', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('confirm_policy: auto');
    expect(skill).toContain('类型：路由控制型');
    expect(skill).toContain('不套用默认产物型 `P0-P5`');
  });

  it('should not claim that status directly regenerates findings.md', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('执行 `/spec-first:status` 读取当前状态，再由 catchup 生成恢复摘要');
    expect(skill).not.toContain('执行 `/spec-first:status` 生成当前状态');
  });
});
