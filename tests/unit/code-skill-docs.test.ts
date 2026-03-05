import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CODE_ROOT = join(import.meta.dirname, '../../skills/spec-first/07-code');
const SKILL_MD = join(CODE_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('07-code skill docs consistency', () => {
  it('should keep test command detection strategy for TDD evidence', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);
    expect(skill).toContain('测试命令探测策略（P1-TDD-CMD）');
    expect(skill).toContain('pnpm test` → `npm test` → `yarn test` → `pytest` → `go test');
    expect(skill).toContain('探测仅用于选择命令，不作为 RED/GREEN 证据');
    expect(skill).toContain('RED 与 GREEN 必须使用同一条最终命令');
  });

  it('should keep validation command template aligned with detection strategy', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('探测顺序: pnpm test → npm test → yarn test → pytest → go test');
    expect(skill).toContain('<selected_test_cmd> <path/to/test>');
    expect(skill).toContain('使用选定命令执行 RED');
    expect(skill).toContain('使用同一命令执行 GREEN');
  });
});
