import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const VERIFY_ROOT = join(import.meta.dirname, '../../skills/spec-first/12-verify');
const SKILL_MD = join(VERIFY_ROOT, 'SKILL.md');
const GATE_CONDITIONS = join(VERIFY_ROOT, 'references/gate-conditions.md');
const COVERAGE = join(VERIFY_ROOT, 'references/coverage-metrics.md');
const TEMPLATE = join(VERIFY_ROOT, 'references/verify-report-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('12-verify skill docs consistency', () => {
  it('should declare verify-view as primary background input', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(GATE_CONDITIONS)).toBe(true);
    expect(existsSync(COVERAGE)).toBe(true);
    expect(existsSync(TEMPLATE)).toBe(true);

    const skill = read(SKILL_MD);
    const gate = read(GATE_CONDITIONS);
    const coverage = read(COVERAGE);
    const report = read(TEMPLATE);

    expect(skill).toContain('verify-view');
    expect(skill).toContain('critical_flows');
    expect(gate).toContain('verify-view');
    expect(coverage).toContain('validation_focus');
    expect(report).toContain('recommended_checks');
  });

  it('should document stronger dependency for high-risk verification', () => {
    const skill = read(SKILL_MD);
    const gate = read(GATE_CONDITIONS);

    expect(skill).toContain('高风险验证');
    expect(skill).toContain('pre-release-verification');
    expect(gate).toContain('L3');
    expect(gate).toContain('background_input_status');
  });
});
