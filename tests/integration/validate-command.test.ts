/**
 * validate 命令集成测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleValidate } from '../../src/cli/commands/validate.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-validate-integration');
const FEATURE_ID = 'TEST-FEAT-INT-001';

function writeStageState(stage = '01_specify') {
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
    'utf-8'
  );
}

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

function writeValidDocumentLinks() {
  writeFileSync(
    join(TEST_ROOT, 'specs', FEATURE_ID, 'document-links.yaml'),
    [
      'version: 1',
      `featureId: ${FEATURE_ID}`,
      'documents:',
      '  - path: spec.md',
      '    kind: requirements',
      '    stage: 01_specify',
      '    references: []',
      '',
    ].join('\n'),
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
    writeValidDocumentLinks();

    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(0);
  });

  it('should fail format validation with missing document-links.yaml', () => {
    writeValidFormatArtifacts();
    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
  });

  it('should fail format validation with title only and no explicit feature id field', () => {
    writeValidDocumentLinks();
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'),
      '## 1. 业务目标\n\n## 2. 功能需求\n\n## 3. 非功能需求\n',
      'utf-8'
    );
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'), '# Spec — TEST-FEAT-INT-001\n');

    expect(handleValidate(['format', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
  });

  it('should fail links validation when references are broken', () => {
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'document-links.yaml'),
      [
        'version: 1',
        `featureId: ${FEATURE_ID}`,
        'documents:',
        '  - path: spec.md',
        '    kind: requirements',
        '    stage: 01_specify',
        '    references:',
        '      - missing.md',
        '',
      ].join('\n'),
      'utf-8'
    );

    expect(handleValidate(['links', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(2);
  });

  it('should pass links validation for correct document-links', () => {
    writeValidDocumentLinks();
    expect(handleValidate(['links', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(0);
  });

  it('should run all validations across format links and gate', () => {
    writeStageState();
    writeValidFormatArtifacts();
    writeValidDocumentLinks();
    mkdirSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'checklists'), { recursive: true });
    writeFileSync(
      join(TEST_ROOT, 'specs', FEATURE_ID, 'checklists', 'spec-review.md'),
      '- [x] 完整性\n- [x] 清晰度\n- [x] 可测量\n- [x] 一致性\n- [x] 风险\n',
      'utf-8'
    );

    expect(handleValidate(['all', FEATURE_ID], { projectRoot: TEST_ROOT })).toBe(0);
  });
});
