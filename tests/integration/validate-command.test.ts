/**
 * validate 命令集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleValidate } from '../../src/cli/commands/validate.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-validate-integration');
const FEATURE_ID = 'TEST-FEAT-INT-001';

function writeValidFormatArtifacts() {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
    '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n',
    'utf-8'
  );
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
    `Feature ID: ${FEATURE_ID}\n`,
    'utf-8'
  );
}

describe('validate command integration', () => {
  beforeEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(join(TEST_ROOT, 'specs', FEATURE_ID), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should pass format validation with correct files', () => {
    writeValidFormatArtifacts();

    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(0);
  });

  it('should pass format validation without document-links.yaml', () => {
    writeValidFormatArtifacts();
    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(0);
  });

  it('should fail format validation with title only and no explicit feature id field', () => {
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n',
      'utf-8'
    );
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'), '# Spec — TEST-FEAT-INT-001\n');

    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
  });

  it('should reject removed validate subcommands', () => {
    writeValidFormatArtifacts();
    expect(handleValidate(['links', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
    expect(handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
  });
});
