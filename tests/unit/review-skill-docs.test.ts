import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REVIEW_ROOT = join(import.meta.dirname, '../../skills/08-review');
const SKILL_MD = join(REVIEW_ROOT, 'SKILL.md');
const OUTPUT_TEMPLATE = join(REVIEW_ROOT, 'references/review-output-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('08-review skill docs consistency', () => {
  it('should classify stage 2 findings in both skill and references', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(OUTPUT_TEMPLATE)).toBe(true);

    const skill = read(SKILL_MD);
    const template = read(OUTPUT_TEMPLATE);

    expect(skill).toContain('Stage 2 输出分级');
    expect(skill).toContain('MUST FIX');
    expect(skill).toContain('SHOULD FIX');
    expect(skill).toContain('OUT_OF_SCOPE');
    expect(template).toContain('MUST FIX');
    expect(template).toContain('SHOULD FIX');
    expect(template).toContain('OUT_OF_SCOPE');
    expect(template).toContain('`OUT_OF_SCOPE` 不得作为当前阻断项');
  });

  it('should enforce classification flow and success criteria', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('P3: Stage 1 通过后执行 Stage 2（质量 + 跨层检查），并按 MUST FIX / SHOULD FIX / OUT_OF_SCOPE 分类');
    expect(skill).toContain('P4: 与用户确认审查发现，范围外问题单独标注并写入 findings.md');
    expect(skill).toContain('Stage 2 发现已按 MUST FIX / SHOULD FIX / OUT_OF_SCOPE 分类');
    expect(skill).toContain('`OUT_OF_SCOPE` 未被包装为当前阻断项');
  });

  it('should keep code-view risk context visible to review', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('code-view');
    expect(skill).toContain('backgroundInputStatus');
    expect(skill).toContain('riskCategory');
    expect(skill).toContain('riskSignals');
  });
});
