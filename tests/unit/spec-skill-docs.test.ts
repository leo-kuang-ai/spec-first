import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC_ROOT = join(import.meta.dirname, '../../skills/spec-first/03-spec');
const SKILL_MD = join(SPEC_ROOT, 'SKILL.md');
const QUESTION_GATE = join(SPEC_ROOT, 'references/question-gate-rules.md');
const FINAL_CONFIRM = join(SPEC_ROOT, 'references/final-confirmation-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('03-spec skill docs consistency', () => {
  it('should declare spec-view as primary background input', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(QUESTION_GATE)).toBe(true);
    expect(existsSync(FINAL_CONFIRM)).toBe(true);

    const skill = read(SKILL_MD);
    const gate = read(QUESTION_GATE);
    const finalConfirm = read(FINAL_CONFIRM);

    expect(skill).toContain('spec-view');
    expect(skill).toContain('优先读取');
    expect(skill).toContain('background_input_status');
    expect(gate).toContain('spec-view');
    expect(finalConfirm).toContain('spec-view');
  });

  it('should document degraded handling when spec-view is unavailable', () => {
    const skill = read(SKILL_MD);
    const gate = read(QUESTION_GATE);

    expect(skill).toContain('degraded');
    expect(skill).toContain('降级');
    expect(gate).toContain('degraded');
    expect(gate).toContain('background_input_status');
  });


  it('should surface assumptions during phase 0.2 quality scan', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('### 隐含假设清单');
    expect(skill).toContain('[ASSUMED]');
    expect(skill).toContain('[NEEDS CLARIFICATION]');
    expect(skill).toContain('通常 / 一般 / 默认 / 预期会');
  });

  it('should distinguish primary references from helper references', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('主文档必须发现（Primary References）');
    expect(skill).toContain('内部辅助参考（Secondary / Helper References）');
    expect(skill).toContain('question-gate-rules.md');
    expect(skill).toContain('final-confirmation-template.md');
  });
});
