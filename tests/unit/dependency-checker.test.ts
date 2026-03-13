import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { checkDependencies } from '../../src/core/process-engine/dependency-checker.js';
import { Stage } from '../../src/shared/types.js';

const TEST_ROOT = join(process.cwd(), 'test-temp-dep');
const FEATURE_ID = 'TEST-FEAT-001';

describe('dependency-checker', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'reports'), { recursive: true });
    writeFileSync(join(TEST_ROOT, 'package.json'),
      JSON.stringify({ scripts: { test: 'vitest', build: 'tsup' } }));
  });

  afterEach(() => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  it('should pass when all dependencies exist', () => {
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'prd.md'), '');
    writeFileSync(join(TEST_ROOT, 'specs', FEATURE_ID, 'spec.md'), '');

    const result = checkDependencies(FEATURE_ID, Stage.DESIGN, TEST_ROOT);
    expect(result.pass).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should detect missing npm scripts', () => {
    writeFileSync(join(TEST_ROOT, 'package.json'), JSON.stringify({ scripts: {} }));

    const result = checkDependencies(FEATURE_ID, Stage.IMPLEMENT, TEST_ROOT, 'strict');
    expect(result.pass).toBe(false);
    expect(result.missing).toContain('npm script: test');
    expect(result.missing).toContain('npm script: build');
  });

  it('should detect missing required files', () => {
    const result = checkDependencies(FEATURE_ID, Stage.DESIGN, TEST_ROOT);
    expect(result.pass).toBe(false);
    expect(result.missing).toContain(`file: specs/${FEATURE_ID}/prd.md`);
  });

  it('should skip check for stage without dependencies', () => {
    const result = checkDependencies(FEATURE_ID, Stage.SPECIFY, TEST_ROOT);
    expect(result.pass).toBe(true);
  });

  it('should detect missing smoke test report', () => {
    // 配置中 RELEASE 阶段检查 contract:check 脚本
    const result = checkDependencies(FEATURE_ID, Stage.RELEASE, TEST_ROOT, 'strict');
    expect(result.pass).toBe(false);
    expect(result.missing).toContain('npm script: contract:check');
  });

  it('should skip npm scripts in default-simplified profile', () => {
    writeFileSync(join(TEST_ROOT, 'package.json'), JSON.stringify({ scripts: {} }));

    const result = checkDependencies(FEATURE_ID, Stage.IMPLEMENT, TEST_ROOT, 'default-simplified');
    expect(result.pass).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('should use default-simplified profile by default', () => {
    writeFileSync(join(TEST_ROOT, 'package.json'), JSON.stringify({ scripts: {} }));

    const result = checkDependencies(FEATURE_ID, Stage.IMPLEMENT, TEST_ROOT);
    expect(result.pass).toBe(true);
  });
});
