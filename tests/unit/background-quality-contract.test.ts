import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTRACT = join(import.meta.dirname, '../../skills/spec-first/shared/background-quality-contract.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('background quality shared contract', () => {
  it('should define canonical output fields and naming layers', () => {
    expect(existsSync(CONTRACT)).toBe(true);

    const contract = read(CONTRACT);

    expect(contract).toContain('background_input_status');
    expect(contract).toContain('runtime 真源');
    expect(contract).toContain('docs 输出');
    expect(contract).toContain('同步状态');
    expect(contract).toContain('backgroundInputStatus');
  });

  it('should define shared enums', () => {
    const contract = read(CONTRACT);

    expect(contract).toContain('full');
    expect(contract).toContain('degraded');
    expect(contract).toContain('blind');

    expect(contract).toContain('healthy');
    expect(contract).toContain('missing');

    expect(contract).toContain('ready');
    expect(contract).toContain('missing');
    expect(contract).toContain('attention');
    expect(contract).toContain('unknown');
  });

  it('should anchor init and review to the shared contract', () => {
    const initSkill = read(join(import.meta.dirname, '../../skills/spec-first/01-init/SKILL.md'));
    const reviewSkill = read(join(import.meta.dirname, '../../skills/spec-first/08-review/SKILL.md'));

    expect(initSkill).toContain('shared/background-quality-contract.md');
    expect(initSkill).toContain('backgroundInputStatus');

    expect(reviewSkill).toContain('shared/background-quality-contract.md');
    expect(reviewSkill).toContain('backgroundInputStatus');
    expect(reviewSkill).toContain('background_input_status');
    expect(reviewSkill).toContain('输入层');
  });

  it('should keep verify aligned with the shared contract', () => {
    const verifySkill = read(join(import.meta.dirname, '../../skills/spec-first/12-verify/SKILL.md'));
    const verifyTemplate = read(join(import.meta.dirname, '../../skills/spec-first/12-verify/references/verify-report-template.md'));

    expect(verifySkill).toContain('shared/background-quality-contract.md');
    expect(verifySkill).toContain('pre-release-verification');
    expect(verifySkill).toContain('background_input_status');
    expect(verifyTemplate).toContain('background_input_status');
  });

  it('should keep status and analyze aligned with the shared contract', () => {
    const statusSkill = read(join(import.meta.dirname, '../../skills/spec-first/14-status/SKILL.md'));
    const statusTemplate = read(join(import.meta.dirname, '../../skills/spec-first/14-status/references/status-dashboard-template.md'));
    const analyzeSkill = read(join(import.meta.dirname, '../../skills/spec-first/21-analyze/SKILL.md'));
    const analyzeRules = read(join(import.meta.dirname, '../../skills/spec-first/21-analyze/references/analysis-rules.md'));
    const analyzeTemplate = read(join(import.meta.dirname, '../../skills/spec-first/21-analyze/references/report-format.md'));

    expect(statusSkill).toContain('shared/background-quality-contract.md');
    expect(statusTemplate).toContain('background_input_status');
    expect(statusTemplate).toContain('runtime 真源');
    expect(statusTemplate).toContain('docs 输出');
    expect(statusTemplate).toContain('同步状态');

    expect(analyzeSkill).toContain('shared/background-quality-contract.md');
    expect(analyzeTemplate).toContain('建议动作');
    expect(analyzeRules).toContain('background_input_status = blind → `HIGH`');
    expect(analyzeRules).toContain('runtime 真源异常 → `HIGH`');
    expect(analyzeRules).toContain('docs 输出缺失 → `MEDIUM`');
    expect(analyzeRules).toContain('同步状态 attention → `MEDIUM`');
  });

  it('should keep doctor and spec aligned with the shared contract', () => {
    const doctorSkill = read(join(import.meta.dirname, '../../skills/spec-first/15-doctor/SKILL.md'));
    const specSkill = read(join(import.meta.dirname, '../../skills/spec-first/03-spec/SKILL.md'));

    expect(doctorSkill).toContain('shared/background-quality-contract.md');
    expect(doctorSkill).toContain('background_input_status');
    expect(doctorSkill).toContain('runtime 真源');
    expect(doctorSkill).toContain('docs 输出');

    expect(specSkill).toContain('shared/background-quality-contract.md');
    expect(specSkill).toContain('spec-view');
    expect(specSkill).toContain('background_input_status');
    expect(specSkill).toContain('degraded');
  });

});
