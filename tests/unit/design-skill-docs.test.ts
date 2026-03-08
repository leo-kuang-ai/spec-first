import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DESIGN_ROOT = join(import.meta.dirname, '../../skills/spec-first/04-design');
const SKILL_MD = join(DESIGN_ROOT, 'SKILL.md');
const GATE_RULES = join(DESIGN_ROOT, 'references/gate-rules.md');
const CONSTRAINTS = join(DESIGN_ROOT, 'references/design-constraints.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('04-design skill docs consistency', () => {
  it('should define a simplicity guard for speculative design', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('## Simplicity First - 设计简洁性守卫');
    expect(skill).toContain('不引入与当前交付无关的投机性层次');
    expect(skill).toContain('多租户 / 插件 / 多实现');
    expect(skill).toContain('记录到 `findings.md`');
  });

  it('should keep feature resolution rules single-sourced', () => {
    const skill = read(SKILL_MD);
    const matches = skill.match(/^## Feature 定位规则$/gm) ?? [];

    expect(matches).toHaveLength(1);
  });

  it('should validate design artifact wording instead of prd wording', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('检查 design.md 章节格式');
    expect(skill).not.toContain('检查 PRD 章节格式');
  });

  it('should enforce simplicity checks in design execution flow', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('P2: 生成 DS（设计规格）条目，映射到 FR，并逐条执行“设计简洁性守卫”自检');
    expect(skill).toContain('P3: 与用户确认设计决策，仅保留直接支撑当前交付的必要设计');
  });

  it('should declare design-view as primary background input', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(GATE_RULES)).toBe(true);
    expect(existsSync(CONSTRAINTS)).toBe(true);

    const skill = read(SKILL_MD);
    const gate = read(GATE_RULES);
    const constraints = read(CONSTRAINTS);

    expect(skill).toContain('design-view');
    expect(skill).toContain('backgroundInputStatus');
    expect(gate).toContain('design-view');
    expect(gate).toContain('正式设计评审');
    expect(constraints).toContain('design-view');
  });

  it('should document minimum background requirements before formal design review', () => {
    const skill = read(SKILL_MD);
    const gate = read(GATE_RULES);

    expect(skill).toContain('正式设计评审');
    expect(skill).toContain('full');
    expect(gate).toContain('L3');
    expect(gate).toContain('backgroundInputStatus');
  });
});
