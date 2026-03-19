import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FEATURE_ROOT = join(import.meta.dirname, '../../skills/spec-first/17-feature');
const SKILL_MD = join(FEATURE_ROOT, 'SKILL.md');
const OUTPUT = join(FEATURE_ROOT, 'references/output-format.md');
const SUBCOMMANDS = join(FEATURE_ROOT, 'references/subcommands.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('17-feature skill docs consistency', () => {
  it('should document current pointer side effects and recovery steps', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(OUTPUT)).toBe(true);
    expect(existsSync(SUBCOMMANDS)).toBe(true);

    const skill = read(SKILL_MD);
    const output = read(OUTPUT);
    const subcommands = read(SUBCOMMANDS);

    expect(skill).toContain('.spec-first/current');
    expect(skill).toContain('/spec-first:catchup');
    expect(output).toContain('.spec-first/current');
    expect(output).toContain('/spec-first:catchup');
    expect(subcommands).toContain('.spec-first/current');
    expect(subcommands).toContain('/spec-first:catchup');
  });

  it('should define switch failure boundaries instead of only happy path', () => {
    const skill = read(SKILL_MD);
    const output = read(OUTPUT);
    const subcommands = read(SUBCOMMANDS);

    expect(skill).toContain('失败标准');
    expect(skill).toContain('目标 Feature 不存在');
    expect(skill).toContain('禁止写入 `.spec-first/current`');
    expect(output).toContain('失败时必须说明失败原因');
    expect(subcommands).toContain('失败时不得改写 current 指针');
  });
});
