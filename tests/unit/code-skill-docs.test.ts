import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CODE_ROOT = join(import.meta.dirname, '../../skills/07-code');
const SKILL_MD = join(CODE_ROOT, 'SKILL.md');
const STANDARDS = join(CODE_ROOT, 'references/code-standards.md');
const DIFF_TEMPLATE = join(CODE_ROOT, 'references/diff-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('07-code skill docs consistency', () => {
  it('should define simplicity and surgical guards near code generation flow', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('Simplicity First');
    expect(skill).toContain('Surgical Changes');
    expect(skill).toContain('findings.md');
  });

  it('should enforce minimal implementation and scope confirmation in execution flow', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('最小实现');
    expect(skill).toContain('上下文包');
  });

  it('should mirror scope guard in references and success criteria', () => {
    expect(existsSync(STANDARDS)).toBe(true);
    expect(existsSync(DIFF_TEMPLATE)).toBe(true);

    const skill = read(SKILL_MD);
    const standards = read(STANDARDS);
    const diffTemplate = read(DIFF_TEMPLATE);

    expect(diffTemplate).toContain('### 范围确认');
    expect(diffTemplate).toContain('是否包含范围外修改');
    expect(diffTemplate).toContain('已记录到 `findings.md`');
    expect(standards).toContain('不为未来需求预埋抽象、配置或扩展点');
    expect(standards).toContain('范围外问题记录到 `findings.md`');
  });

  it('should extend diff preview with explicit scope confirmation', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('findings.md');
  });

  it('should keep test command detection strategy for TDD evidence', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);
    expect(skill).toContain('TDD');
  });

  it('should keep validation command template aligned with detection strategy', () => {
    const skill = read(SKILL_MD);
    expect(skill).toContain('TDD');
  });

  it('should document code-view background fields', () => {
    const skill = read(SKILL_MD);
    const standards = read(STANDARDS);

    expect(skill).toContain('backgroundInputStatus');
    expect(standards).toContain('entryPoints');
    expect(standards).toContain('likelyChangeAreas');
    expect(standards).toContain('changeHazards');
  });

  it('should align code background naming with the shared contract', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('shared/background-quality-contract.md');
    expect(skill).toContain('backgroundInputStatus');
    expect(skill).toContain('background_input_status');
  });

  it('should keep target-state features explicitly downgraded from current runtime truth', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('当前未兑现的目标态能力');
    expect(skill).toContain('stop_on_failure_rate');
    expect(skill).toContain('不是当前稳定运行能力');
    expect(skill).toContain('不应当作当前执行依据');
  });
});
