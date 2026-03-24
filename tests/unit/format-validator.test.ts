import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { validateFormat } from '../../src/core/validators/format-validator.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-validate');
const FEATURE_ID = 'TEST-FEAT-001';

describe('format-validator', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_ROOT, 'specs', FEATURE_ID), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should pass when all formats are correct', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-001\n');

    const result = validateFormat(FEATURE_ID, TEST_ROOT);
    expect(result.pass).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept markdown-emphasized feature id field in spec', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      '**Feature ID**: TEST-FEAT-001\n');

    const result = validateFormat(FEATURE_ID, TEST_ROOT);
    expect(result.pass).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject spec with title only and no explicit feature id field', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      '# Spec — FSREQ-20260312-AUTH-001\n');

    const result = validateFormat(FEATURE_ID, TEST_ROOT);
    expect(result.pass).toBe(false);
    expect(result.errors).toContain('spec.md 缺少 Feature ID 字段');
  });

  it('should detect missing PRD chapters', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-001\n');

    const result = validateFormat(FEATURE_ID, TEST_ROOT);
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('2. 功能需求'))).toBe(true);
  });

  it('should detect missing required files', () => {
    const result = validateFormat(FEATURE_ID, TEST_ROOT);
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('spec.md'))).toBe(true);
  });
});
