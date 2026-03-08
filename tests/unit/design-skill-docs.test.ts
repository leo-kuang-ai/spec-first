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
