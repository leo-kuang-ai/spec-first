import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ANALYZE_ROOT = join(import.meta.dirname, '../../skills/21-analyze');
const SKILL_MD = join(ANALYZE_ROOT, 'SKILL.md');
const RULES = join(ANALYZE_ROOT, 'references/analysis-rules.md');
const REPORT = join(ANALYZE_ROOT, 'references/report-format.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('21-analyze skill docs consistency', () => {
  it('should include background input status in analysis scope', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(RULES)).toBe(true);
    expect(existsSync(REPORT)).toBe(true);

    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('background_input_status');
    expect(skill).toContain('背景质量');
    expect(rules).toContain('background_input_status');
  });

  it('should analyze runtime truth source and docs output issues', () => {
    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('runtime 真源');
    expect(rules).toContain('docs 输出');
    expect(rules).toContain('缺失');
  });

  it('should make background quality analysis explicit in execution flow', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('P1: 读取 `spec.md`、`design.md`、`task_plan.md`、`document-links.yaml`，并加载 `background_input_status` 与 runtime/docs 背景状态');
    expect(skill).toContain('P2: 执行一致性分析（歧义词、文档关联缺口、产物缺失、潜在冲突、背景质量异常）');
    expect(skill).toContain('P5: 输出结论摘要、背景质量结论与后续修复建议');
  });

  it('should include background quality in success criteria and report format', () => {
    const skill = read(SKILL_MD);
    const report = read(REPORT);

    expect(skill).toContain('报告包含背景质量结论（`background_input_status` / `runtime 真源` / `docs 输出` / `同步状态`）');
    expect(report).toContain('## 背景质量结论');
    expect(report).toContain('background_input_status');
    expect(report).toContain('runtime 真源');
    expect(report).toContain('docs 输出');
    expect(report).toContain('同步状态');
  });

  it('should classify background drift severity in analysis rules', () => {
    const rules = read(RULES);

    expect(rules).toContain('runtime 真源异常 → `HIGH`');
    expect(rules).toContain('docs 输出缺失 → `MEDIUM`');
    expect(rules).toContain('background_input_status = blind → `HIGH`');
  });

  it('should keep report examples aligned with background quality section', () => {
    const report = read(REPORT);
    const matches = report.match(/## 背景质量结论/g) ?? [];

    expect(matches.length).toBeGreaterThanOrEqual(3);
    expect(report).not.toContain('---\n---');
  });
});
