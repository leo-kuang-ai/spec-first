import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { init } from '../../src/core/process-engine/init.js';

const DOC_ROOT = join(import.meta.dirname, '../../skills/spec-first');
const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-plan-artifact-structure');

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first', 'layer2'), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'layer2', 'h5.yaml'), 'platform: h5\n', 'utf-8');
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('plan artifact structure', () => {
  it('documents task plan structure with implementation and verification fields', () => {
    const template = readFileSync(join(DOC_ROOT, '06-task/references/task-template.md'), 'utf-8');
    expect(template).toContain('| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |');
    expect(template).toContain('## 实施步骤');
    expect(template).toContain('## 验证命令');
  });

  it('documents findings structure around plan, evidence, risk and next steps', () => {
    const schema = readFileSync(join(DOC_ROOT, '11-plan/references/findings-schema.md'), 'utf-8');
    expect(schema).toContain('## Plan Summary');
    expect(schema).toContain('## Decision Log');
    expect(schema).toContain('## Execution Evidence');
    expect(schema).toContain('## Risks & Blockers');
    expect(schema).toContain('## Next Steps');
  });

  it('initializes findings and task plan with the same canonical sections', () => {
    const { featureId } = init({ feat: 'STR', mode: 'N', size: 'S', platforms: ['h5'], title: 'Structure', projectRoot: TMP });
    const findings = readFileSync(join(TMP, 'specs', featureId, 'findings.md'), 'utf-8');
    const taskPlan = readFileSync(join(TMP, 'specs', featureId, 'task_plan.md'), 'utf-8');

    expect(findings).toContain('## Plan Summary');
    expect(findings).toContain('## Execution Evidence');
    expect(findings).toContain('## Next Steps');
    expect(taskPlan).toContain('| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |');
    expect(taskPlan).toContain('## 实施步骤');
  });
});
