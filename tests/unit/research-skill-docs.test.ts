import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RESEARCH_ROOT = join(import.meta.dirname, '../../skills/05-research');
const SKILL_MD = join(RESEARCH_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('05-research skill docs consistency', () => {
  it('should declare design-stage research positioning and findings sync', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('02_design');
    expect(skill).toContain('research.md');
    expect(skill).toContain('findings.md');
  });

  it('should keep evidence verification markers and evidence-types reference', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('[NEEDS VERIFICATION][TYPE]');
    expect(skill).toContain('evidence-types.md');
  });

  it('should define 04-design companion contract and design round-trip', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('04-design');
    expect(skill).toContain('companion skill');
    expect(skill).toContain('research.md');
    expect(skill).toContain('design.md');
    expect(skill).toContain('不直接生成 `design.md`');
  });

  it('should include research task types and decision framework', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('TYPE A: 方案选型');
    expect(skill).toContain('TYPE B: 最佳实践 / 实现参考');
    expect(skill).toContain('TYPE C: 背景追溯 / 历史决策');
    expect(skill).toContain('问题匹配度');
    expect(skill).toContain('证据强度');
  });
});
