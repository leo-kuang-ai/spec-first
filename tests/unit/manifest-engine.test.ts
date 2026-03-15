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

describe('基础步骤执行', () => {
  it('patch 在目标文件不存在时应创建文件并写入 patch 内容', () => {
    const step: MigrationStep = {
      type: 'patch',
      file: 'meta/template-hashes.json',
      patch: {
        version: '1.0.0',
        generated: '1970-01-01T00:00:00Z',
        templates: {},
      },
      mergeStrategy: 'replace',
    } as MigrationStep;

    const result = executeStep(step, TMP);

    expect(result.success).toBe(true);
    expect(existsSync(join(TMP, 'meta', 'template-hashes.json'))).toBe(true);
    expect(JSON.parse(readFileSync(join(TMP, 'meta', 'template-hashes.json'), 'utf-8'))).toEqual(
      step.patch,
    );
  });
});
