import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateGate } from '../../src/core/gate-engine/gate-evaluator.ts';
import { validateExceptions } from '../../src/core/trace-engine/exception-validator.ts';
import { loadRfcStatuses } from '../../src/core/change-mgr/rfc.ts';

describe('Gate Waiver Mechanism', () => {
  const testRoot = join(process.cwd(), 'tests/fixtures/gate-waiver-test');
  const featureId = 'TEST-FEATURE-001';
  const featureDir = join(testRoot, 'specs', featureId);

  beforeEach(() => {
    mkdirSync(featureDir, { recursive: true });
    mkdirSync(join(featureDir, 'rfc'), { recursive: true });
    mkdirSync(join(featureDir, 'checklists'), { recursive: true });

    // 创建 stage-state.json
    writeFileSync(
      join(featureDir, 'stage-state.json'),
      JSON.stringify({
        currentStage: '01_specify',
        mode: 'standard',
        size: 'medium',
        platforms: ['ios'],
      })
    );

    // 创建 PRD (C-PRD=70%)
    writeFileSync(
      join(featureDir, 'prd.md'),
      `---
quality_score: 70
---
# PRD
## 1. 业务目标
Content
## 2. 功能需求
Content
## 3. 非功能需求
Content
## 4. 开放问题
Content
`
    );

    // 创建 spec.md
    writeFileSync(join(featureDir, 'spec.md'), '# Spec');
    writeFileSync(
      join(featureDir, 'document-links.yaml'),
      `version: 1
featureId: ${featureId}
documents:
  - path: spec.md
    kind: spec
    stage: 01_specify
    references: []
`,
    );

    // 创建 spec-review.md (C10 >= 80%)
    writeFileSync(
      join(featureDir, 'checklists', 'spec-review.md'),
      `# Spec Review
- [x] Check 1
- [x] Check 2
- [x] Check 3
- [x] Check 4
- [ ] Check 5
`
    );

  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  it('should PASS with warning when C-PRD < 85%', () => {
    const result = evaluateGate(featureId, testRoot);
    expect(result.status).toBe('PASS');
    const cprdCondition = result.conditions.find((c) => c.id === 'G-SPEC-00');
    expect(cprdCondition?.status).toBe('FAIL');
    expect(cprdCondition?.blocking).toBe(false);
  });

  it('should return scopeFrIds for G-SPEC-00 condition', () => {
    const result = evaluateGate(featureId, testRoot);
    const cprdCondition = result.conditions.find((c) => c.id === 'G-SPEC-00');
    expect(cprdCondition).toBeDefined();
    expect(cprdCondition?.scopeFrIds ?? []).toEqual([]);
  });

  it('should not apply waiver to warning conditions', () => {
    // 创建已批准的 RFC
    writeFileSync(
      join(featureDir, 'rfc', 'RFC-001.rfc.json'),
      JSON.stringify({
        id: 'RFC-001',
        status: 'approved',
        title: 'C-PRD Waiver',
        createdAt: '2026-03-12',
      })
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    writeFileSync(
      join(featureDir, 'known-exceptions.md'),
      `| ID | RFC ID | FR ID | Reason | Expires At | Rollback Point | Approved By | Approved At |
|----|--------|-------|--------|------------|----------------|-------------|-------------|
| EXC-001 | RFC-001 | FR-TEST-001 | Test waiver | ${expiresAt} | 01_specify | Tester | 2026-03-12 |
`
    );

    const result = evaluateGate(featureId, testRoot);

    expect(result.status).toBe('PASS');
    const cprdCondition = result.conditions.find((c) => c.id === 'G-SPEC-00');
    expect(cprdCondition?.status).toBe('FAIL');
    expect(cprdCondition?.blocking).toBe(false);
    expect(result.waivers).toBeUndefined();
  });
});
