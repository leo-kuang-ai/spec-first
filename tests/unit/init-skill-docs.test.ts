import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const INIT_ROOT = join(import.meta.dirname, '../../skills/spec-first/01-init');
const SKILL_MD = join(INIT_ROOT, 'SKILL.md');
const PREREQ = join(INIT_ROOT, 'references/prerequisites.md');
const OUTPUT = join(INIT_ROOT, 'references/output-format.md');
const INTERACTION = join(INIT_ROOT, 'references/interaction-guide.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('01-init skill docs', () => {
  it('should document first as preferred background input instead of hard prerequisite', () => {
    const skill = read(SKILL_MD);
    const prereq = read(PREREQ);
    const output = read(OUTPUT);
    const interaction = read(INTERACTION);

    expect(skill).toContain('shared/background-quality-contract.md');
    expect(skill).toContain('backgroundInputStatus');

    expect(prereq).toContain('优先背景输入');
    expect(prereq).toContain('不阻断初始化');
    expect(prereq).toContain('降级模式继续');
    expect(prereq).not.toContain('无法初始化需求工作区');

    expect(output).toContain('当前以降级背景状态初始化');
    expect(output).not.toContain('初始化失败: 缺失 00-first runtime 真源');

    expect(interaction).toContain('降级模式继续');
    expect(interaction).toContain('/spec-first:first');
  });
});
