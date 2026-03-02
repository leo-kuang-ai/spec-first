/**
 * manifest-engine 路径遍历防护测试 (TEST-SEC-002)
 * + 基础步骤执行测试 (TEST-COV-003 部分覆盖)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { executeStep, executeManifest } from '../../src/core/migrations/manifest-engine.js';
import { ConflictStrategy } from '../../src/core/migrations/manifest-schema.js';
import type { MigrationManifest, MigrationStep } from '../../src/core/migrations/manifest-schema.js';

const TMP = join(process.cwd(), 'tests', 'fixtures', 'manifest-engine-test');

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── SEC-002: 路径遍历防护 ─────────────────────────────────

describe('SEC-002: 路径遍历防护', () => {
  it('mkdir 拒绝 ../ 逃逸', () => {
    const step: MigrationStep = { type: 'mkdir', path: '../../../tmp/evil' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('delete 拒绝 ../ 逃逸', () => {
    const step: MigrationStep = { type: 'delete', path: '../../etc/passwd' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('rename 拒绝 from 逃逸', () => {
    const step: MigrationStep = { type: 'rename', from: '../../../etc/passwd', to: 'stolen.txt' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('rename 拒绝 to 逃逸', () => {
    writeFileSync(join(TMP, 'legit.txt'), 'ok');
    const step: MigrationStep = { type: 'rename', from: 'legit.txt', to: '../../../tmp/evil.txt' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('copy 拒绝 from 逃逸', () => {
    const step: MigrationStep = { type: 'copy', from: '../../../etc/hosts', to: 'hosts.txt' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('patch 拒绝逃逸', () => {
    const step: MigrationStep = { type: 'patch', file: '../../package.json', patch: { hacked: true }, mergeStrategy: 'merge' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('execute 拒绝 cwd 逃逸', () => {
    const step: MigrationStep = { type: 'execute', command: 'echo', args: ['hi'], cwd: '../../../tmp' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/路径遍历被拒绝/);
  });

  it('允许合法子目录路径', () => {
    const step: MigrationStep = { type: 'mkdir', path: 'sub/dir/deep' } as MigrationStep;
    const result = executeStep(step, TMP);
    expect(result.success).toBe(true);
    expect(existsSync(join(TMP, 'sub/dir/deep'))).toBe(true);
  });
});
