/**
 * 审计日志 hash chain 测试
 * @see TASK-ORCH-006
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  writeAuditLog,
  readAuditLog,
  verifyAuditChain,
  getAuditLogPath,
} from '../../src/core/ai-orchestrator/audit-log.js';
import { resetConfigCache } from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-audit-log');
const FEAT = 'FSREQ-AUDIT-001';

beforeEach(() => {
  resetConfigCache();
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

describe('writeAuditLog', () => {
  it('写入一条记录并包含 prevHash/hash', () => {
    const record = writeAuditLog(
      { event: 'task_started', featureId: FEAT, taskId: 'T1' },
      TMP,
    );

    expect(record).not.toBeNull();
    expect(record!.event).toBe('task_started');
    expect(record!.prevHash).toHaveLength(64);
    expect(record!.hash).toHaveLength(64);
    expect(record!.timestamp).toBeTruthy();
  });

  it('连续写入形成 hash chain', () => {
    writeAuditLog({ event: 'task_started', featureId: FEAT, taskId: 'T1' }, TMP);
    writeAuditLog({ event: 'task_done', featureId: FEAT, taskId: 'T1' }, TMP);

    const records = readAuditLog(FEAT, TMP);
    expect(records).toHaveLength(2);
    // 第二条的 prevHash 等于第一条的 hash
    expect(records[1].prevHash).toBe(records[0].hash);
  });
});

describe('verifyAuditChain', () => {
  it('空日志校验通过', () => {
    const result = verifyAuditChain(FEAT, TMP);
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(0);
  });

  it('正常 chain 校验通过', () => {
    writeAuditLog({ event: 'task_started', featureId: FEAT, taskId: 'T1' }, TMP);
    writeAuditLog({ event: 'task_done', featureId: FEAT, taskId: 'T1' }, TMP);
    writeAuditLog({ event: 'task_started', featureId: FEAT, taskId: 'T2' }, TMP);

    const result = verifyAuditChain(FEAT, TMP);
    expect(result.valid).toBe(true);
    expect(result.totalRecords).toBe(3);
  });
});

describe('readAuditLog', () => {
  it('无文件时返回空数组', () => {
    const records = readAuditLog(FEAT, TMP);
    expect(records).toEqual([]);
  });
});

describe('getAuditLogPath', () => {
  it('返回正确路径', () => {
    const path = getAuditLogPath(FEAT, TMP);
    expect(path).toContain('specs');
    expect(path).toContain(FEAT);
    expect(path.endsWith('audit.jsonl')).toBe(true);
  });
});
