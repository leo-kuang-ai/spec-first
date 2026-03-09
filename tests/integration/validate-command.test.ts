/**
 * validate 命令集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleValidate } from '../../src/cli/commands/validate.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-validate-integration');
const FEATURE_ID = 'TEST-FEAT-INT-001';

function writeStageState(stage = '00_init') {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'stage-state.json'),
    JSON.stringify({
      featureId: FEATURE_ID,
      title: 'Validate Integration Test',
      currentStage: stage,
      mode: 'N',
      size: 'S',
      platforms: ['h5'],
      history: [],
      terminal: false,
      createdAt: '2026-03-09T00:00:00.000Z',
      updatedAt: '2026-03-09T00:00:00.000Z',
    }),
  );
}

function writeValidFormatArtifacts() {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
    '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n',
  );
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'),
    `Feature ID: ${FEATURE_ID}\n`,
  );
}

function writeFormatSafeMatrix() {
  writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'), '');
}

function writeBrokenMatrix() {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
    [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned | REQ-AUTH-001 | |',
    ].join('\n') + '\n',
  );
}

function writeValidMatrix() {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
    [
      '| ID | Type | Title | Status | Upstream | Downstream |',
      '|----|------|-------|--------|----------|------------|',
      '| FR-AUTH-001 | FR | Login | Planned | REQ-PRD-AUTH-001 | DS-AUTH-001, TASK-AUTH-001, TC-UT-AUTH-001 |',
      '| DS-AUTH-001 | DS | Login design | Planned | FR-AUTH-001 | TASK-AUTH-001 |',
      '| TASK-AUTH-001 | TASK | Implement login | Planned | DS-AUTH-001 | |',
      '| TC-UT-AUTH-001 | TC | Test login | Planned | FR-AUTH-001 | |',
    ].join('\n') + '\n',
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
    writeFormatSafeMatrix();

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(0);
  });

  it('should fail format validation with missing PRD chapters', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'), '## 1. 业务目标\n');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'), `Feature ID: ${FEATURE_ID}\n`);
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'), '');

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should fail format validation with invalid ID format', () => {
    writeValidFormatArtifacts();
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'traceability-matrix.md'),
      '| FR-SPEC-OPT-001 | FR | Test | Design | |\n',
    );

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should fail matrix validation when traceability chain is broken', () => {
    writeBrokenMatrix();

    const result = handleValidate(['matrix', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should pass matrix validation when traceability chain is complete', () => {
    writeValidMatrix();

    const result = handleValidate(['matrix', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(0);
  });

  it('should show help for unknown subcommand', () => {
    const result = handleValidate(['unknown'], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should show help for missing featureId', () => {
    const result = handleValidate(['format'], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should run all validations across format matrix and gate', () => {
    writeValidFormatArtifacts();
    writeFormatSafeMatrix();
    writeStageState();

    const result = handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(0);
  });

  it('should fail all validation when any sub-check fails', () => {
    writeValidFormatArtifacts();
    writeBrokenMatrix();
    writeStageState();

    const result = handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });

  it('should detect missing required files', () => {
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n',
    );

    const result = handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT });
    expect(result).toBe(2);
  });
});
