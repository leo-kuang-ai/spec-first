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

  it('should keep verify-view required fields consistent in snake_case', () => {
    const skill = read(SKILL_MD);
    const report = read(TEMPLATE);

    expect(skill).toContain('validation_hooks');
    expect(skill).toContain('release_blockers');
    expect(skill).toContain('critical_flows');
    expect(skill).toContain('validation_focus');
    expect(skill).toContain('recommended_checks');

    expect(report).toContain('critical_flows');
    expect(report).toContain('validation_focus');
    expect(report).toContain('recommended_checks');
    expect(report).toContain('validation_hooks');
    expect(report).toContain('release_blockers');
    expect(report).toContain('background_input_status');

    expect(report).not.toContain('criticalFlows');
    expect(report).not.toContain('validationFocus');
    expect(report).not.toContain('recommendedChecks');
  });

  it('should document stronger dependency for high-risk verification', () => {
    const skill = read(SKILL_MD);
    const gate = read(GATE_CONDITIONS);

    expect(skill).toContain('高风险验证');
    expect(skill).toContain('pre-release-verification');
    expect(gate).toContain('L3');
    expect(gate).toContain('background_input_status');
  });

  it('should make completion verification flow explicit', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('**P1**: 加载 `verify-view`、文档关联、文档健康指标、Gate 条件');
    expect(skill).toContain('**P2**: 执行 `gate check`、`docs links validate`、`metrics report`，获取验证结果');
    expect(skill).toContain('**P3**: 生成校验报告（Gate 评估、文档关联完整性、文档健康缺口、verify-view 重点、修复建议）');
    expect(skill).toContain('已核对 `verify-view` 必查字段并纳入校验结论');
  });
});
