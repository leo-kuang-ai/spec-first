/**
 * Config Schema Runtime Extensions 测试
 * @see TASK-ORCH-007 配置 schema 扩展（Phase A）
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, resetConfigCache } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-config-ext');

beforeEach(() => {
  resetConfigCache();
  mkdirSync(join(TMP, '.spec-first', 'meta'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

describe('auto_orchestrate defaults', () => {
  it('无 config.yaml 时返回默认值', () => {
    const cfg = loadConfig(TMP);
    const ao = cfg.runtime.auto_orchestrate;
    expect(ao.enabled).toBe(false);
    expect(ao.stop_on_blocked).toBe(true);
    expect(ao.max_task_duration_ms).toBe(600_000);
    expect(ao.heartbeat_timeout_ms).toBe(300_000);
    expect(ao.watchdog_interval_ms).toBe(10_000);
    expect(ao.max_retry_per_task).toBe(3);
    expect(ao.retry_backoff_ms).toBe(2_000);
    expect(ao.max_total_retry_duration_ms).toBe(900_000);
    expect(ao.max_parallel).toBe(1);
  });
});

describe('audit_log defaults', () => {
  it('无 config.yaml 时返回默认值', () => {
    const cfg = loadConfig(TMP);
    const al = cfg.runtime.audit_log;
    expect(al.enabled).toBe(true);
    expect(al.tamper_proof).toBe('hash_chain');
    expect(al.rotation_size_mb).toBe(10);
  });
});

describe('auto_orchestrate merge', () => {
  it('部分覆盖保留其余默认值', () => {
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  auto_orchestrate:\n    enabled: true\n    max_parallel: 2\n',
    );
    const cfg = loadConfig(TMP);
    expect(cfg.runtime.auto_orchestrate.enabled).toBe(true);
    expect(cfg.runtime.auto_orchestrate.max_parallel).toBe(2);
    // 未覆盖项保持默认
    expect(cfg.runtime.auto_orchestrate.max_task_duration_ms).toBe(600_000);
    expect(cfg.runtime.auto_orchestrate.retry_backoff_ms).toBe(2_000);
  });
});

describe('audit_log merge', () => {
  it('tamper_proof 可设为 none', () => {
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  audit_log:\n    tamper_proof: none\n',
    );
    const cfg = loadConfig(TMP);
    expect(cfg.runtime.audit_log.tamper_proof).toBe('none');
  });

  it('非法 tamper_proof 值保持默认', () => {
    writeFileSync(
      join(TMP, '.spec-first', 'meta', 'config.yaml'),
      'runtime:\n  audit_log:\n    tamper_proof: invalid\n',
    );
    const cfg = loadConfig(TMP);
    expect(cfg.runtime.audit_log.tamper_proof).toBe('hash_chain');
  });
});
