import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const STATUS_ROOT = join(import.meta.dirname, '../../skills/14-status');
const SKILL_MD = join(STATUS_ROOT, 'SKILL.md');
const DASHBOARD = join(STATUS_ROOT, 'references/status-dashboard-template.md');
const RISK = join(STATUS_ROOT, 'references/risk-indicators.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('14-status skill docs consistency', () => {
  it('should display background_input_status and source layers', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(DASHBOARD)).toBe(true);

    const skill = read(SKILL_MD);
    const dashboard = read(DASHBOARD);

    expect(skill).toContain('background_input_status');
    expect(skill).toContain('runtime 真源');
    expect(dashboard).toContain('background_input_status');
    expect(dashboard).toContain('docs 输出');
  });

  it('should distinguish runtime truth source from docs output state', () => {
    const skill = read(SKILL_MD);
    const dashboard = read(DASHBOARD);

    expect(skill).toContain('docs 输出');
    expect(dashboard).toContain('runtime 真源');
    expect(dashboard).toContain('同步状态');
  });

  it('should make layered status collection explicit in execution flow', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('**P1**: 加载 stage-state、指标、任务计划、Gate 历史，并读取 `background_input_status` 与 runtime/docs 分层状态');
    expect(skill).toContain('**P2**: 计算健康分、识别风险、判断 runtime 真源是否异常、docs 输出是否缺失');
    expect(skill).toContain('**P3**: 生成状态仪表盘（阶段、覆盖率、健康分、任务、风险、背景状态卡片）');
  });

  it('should include background state and sync status in success criteria', () => {
    const skill = read(SKILL_MD);

    expect(skill).toContain('状态面板已展示 `background_input_status`、`runtime 真源`、`docs 输出`、`同步状态`');
  });

  it('should keep status metrics and task states aligned with canonical semantics', () => {
    const skill = read(SKILL_MD);
    const dashboard = read(DASHBOARD);

    expect(skill).toContain('C1 (Design Coverage)');
    expect(dashboard).toContain('C1 (Design Coverage)');
    expect(skill).not.toContain('C1 (Spec Coverage)');
    expect(dashboard).not.toContain('C1 (Spec Coverage)');

    expect(skill).toContain('汇总层只展示 canonical 状态：`todo / in_progress / blocked / done`');
    expect(dashboard).toContain('汇总层只展示 canonical 状态：`todo / in_progress / blocked / done`');
    expect(skill).not.toContain('| ✅ complete |');
    expect(dashboard).not.toContain('| ✅ complete |');
  });

  it('should treat runtime/docs output issues as explicit status risk', () => {
    expect(existsSync(RISK)).toBe(true);
    const risk = read(RISK);

    expect(risk).toContain('docs 输出缺失');
    expect(risk).toContain('runtime 真源异常');
    expect(risk).toContain('同步状态异常');
  });
});
