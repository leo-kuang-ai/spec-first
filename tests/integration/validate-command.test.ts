/**
 * validate 命令集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleValidate } from '../../src/cli/commands/validate.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-validate-integration');
const FEATURE_ID = 'TEST-FEAT-INT-001';

describe('validate command integration', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_ROOT, 'specs', FEATURE_ID), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should pass format validation with correct files', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-INT-001\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
      '| FR-001 | FR | Test | Design | |\n');

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(0);
  });

  it('should fail format validation with missing PRD chapters', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-INT-001\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'), '');

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2); // ExitCode.VALIDATION_ERROR
  });

  it('should fail format validation with invalid ID format', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-INT-001\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
      '| FR-SPEC-OPT-001 | FR | Test | Design | |\n');

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2); // ExitCode.VALIDATION_ERROR
  });

  it('should show help for unknown subcommand', () => {
    const result = handleValidate(['unknown'], { projectRoot: TEST_ROOT });
    expect(result).toBe(2); // ExitCode.VALIDATION_ERROR
  });

  it('should show help for missing featureId', () => {
    const result = handleValidate(['format'], { projectRoot: TEST_ROOT });
    expect(result).toBe(2); // ExitCode.VALIDATION_ERROR
  });

  it('should run all validations', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
      'Feature ID: TEST-FEAT-INT-001\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
      '| FR-001 | FR | Test | Design | |\n');

    const result = handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(0);
  });

  it('should detect missing required files', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n');

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2); // ExitCode.VALIDATION_ERROR
  });
});
