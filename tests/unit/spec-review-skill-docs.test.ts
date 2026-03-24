import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC_REVIEW_ROOT = join(import.meta.dirname, '../../skills/20-spec-review');
const SKILL_MD = join(SPEC_REVIEW_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('20-spec-review skill docs consistency', () => {
  it('should declare first project cognition inputs for spec review', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('First 项目认知资产接入');
    expect(skill).toContain('critical-flows.json');
    expect(skill).toContain('domain-model.json');
    expect(skill).toContain('summary.json');
    expect(skill).toContain('缺少项目认知辅助输入');
  });
});
