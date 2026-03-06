import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { validatePrd } from '../../src/core/gate-engine/prd-validator.js';

describe('prd-validator', () => {
  const testDir = join(process.cwd(), 'test-tmp-prd-validator');
  const prdPath = join(testDir, 'prd.md');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('valid PRD with all sections and metadata', () => {
    const content = `---
scenario: "greenfield"
scenario_reason: "新功能开发"
evidence_paths: ["src/auth.ts"]
complexity: "Moderate"
created_at: "2026-03-05T00:00:00Z"
last_updated: "2026-03-05T00:00:00Z"
---

# PRD — TEST-001

## 1. 业务目标
### 1.1 问题陈述
测试内容
### 1.2 业务价值
测试内容

## 2. 功能需求
### 2.1 核心功能
测试内容
### 2.2 用户故事
测试内容

## 3. 非功能需求
测试内容
`;
    writeFileSync(prdPath, content, 'utf-8');
    const result = validatePrd(prdPath);
    expect(result.valid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.errors).toHaveLength(0);
  });

  it('missing required sections', () => {
    const content = `---
scenario: "greenfield"
scenario_reason: "test"
evidence_paths: ["test.ts"]
complexity: "Simple"
---

# PRD — TEST-001

## 1. 业务目标
测试
`;
    writeFileSync(prdPath, content, 'utf-8');
    const result = validatePrd(prdPath);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('功能需求'))).toBe(true);
  });

  it('scenario not determined', () => {
    const content = `---
scenario: "待判定"
scenario_reason: ""
evidence_paths: []
complexity: "待判定"
---

# PRD — TEST-001

## 1. 业务目标
## 2. 功能需求
## 3. 非功能需求
`;
    writeFileSync(prdPath, content, 'utf-8');
    const result = validatePrd(prdPath);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('scenario 未判定'))).toBe(true);
    expect(result.errors.some(e => e.includes('complexity 未判定'))).toBe(true);
  });

  it('C-PRD score below 85%', () => {
    const content = `---
scenario: "greenfield"
scenario_reason: ""
evidence_paths: []
complexity: "Simple"
---

# PRD — TEST-001

## 1. 业务目标
[placeholder]
## 2. 功能需求
[placeholder]
## 3. 非功能需求
[placeholder]
[placeholder]
`;
    writeFileSync(prdPath, content, 'utf-8');
    const result = validatePrd(prdPath);
    expect(result.score).toBeLessThan(85);
    expect(result.valid).toBe(false);
  });
});
