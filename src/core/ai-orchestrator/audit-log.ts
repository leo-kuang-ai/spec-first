/**
 * 审计日志 hash chain
 * JSONL 原子追加，每条记录含 prevHash/hash（SHA256）
 * @see TASK-ORCH-006, V2-13§5.1
 */
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { appendJsonl, exists } from '../../shared/fs-utils.js';
import { readFileSync } from 'node:fs';
import { loadConfig } from '../../shared/config-schema.js';

// ─── 类型定义 ───────────────────────────────────────────

export interface AuditEntry {
  event: string;
  featureId: string;
  taskId?: string;
  detail?: Record<string, unknown>;
}

export interface AuditRecord extends AuditEntry {
  timestamp: string;
  prevHash: string;
  hash: string;
}

// ─── 核心函数 ───────────────────────────────────────────

/** SHA256 hex digest */
function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}

/** 获取审计日志文件路径 */
export function getAuditLogPath(featureId: string, projectRoot: string): string {
  return join(projectRoot, 'specs', featureId, 'audit.jsonl');
}

/** 读取最后一条记录的 hash，作为下一条的 prevHash */
function getLastHash(logPath: string): string {
  if (!exists(logPath)) return '0'.repeat(64);
  const raw = readFileSync(logPath, 'utf-8').trim();
  if (!raw) return '0'.repeat(64);
  const lines = raw.split('\n').filter(Boolean);
  const lastLine = lines[lines.length - 1];
  try {
    const record = JSON.parse(lastLine) as AuditRecord;
    return record.hash ?? '0'.repeat(64);
  } catch {
    return '0'.repeat(64);
  }
}

/**
 * 写入一条审计日志（hash chain 模式）
 * 如果 audit_log.enabled=false 则静默跳过
 */
export function writeAuditLog(entry: AuditEntry, projectRoot: string): AuditRecord | null {
  const cfg = loadConfig(projectRoot);
  if (!cfg.runtime.audit_log.enabled) return null;

  const logPath = getAuditLogPath(entry.featureId, projectRoot);
  const timestamp = new Date().toISOString();
  const prevHash = getLastHash(logPath);

  // 构建不含 hash 的记录用于计算 hash
  const payload = { ...entry, timestamp, prevHash };
  const hash =
    cfg.runtime.audit_log.tamper_proof === 'hash_chain' ? sha256(JSON.stringify(payload)) : '';

  const record: AuditRecord = { ...payload, hash };
  appendJsonl(logPath, record as unknown as Record<string, unknown>);
  return record;
}

/** 读取审计日志全部记录 */
export function readAuditLog(featureId: string, projectRoot: string): AuditRecord[] {
  const logPath = getAuditLogPath(featureId, projectRoot);
  if (!exists(logPath)) return [];
  const raw = readFileSync(logPath, 'utf-8').trim();
  if (!raw) return [];

  const records: AuditRecord[] = [];
  for (const line of raw.split('\n').filter(Boolean)) {
    try {
      records.push(JSON.parse(line) as AuditRecord);
    } catch {
      // skip corrupted line
    }
  }
  return records;
}

export interface ChainVerifyResult {
  valid: boolean;
  totalRecords: number;
  brokenAt?: number;
  reason?: string;
}

/** 校验 hash chain 完整性 */
export function verifyAuditChain(featureId: string, projectRoot: string): ChainVerifyResult {
  const records = readAuditLog(featureId, projectRoot);
  if (records.length === 0) return { valid: true, totalRecords: 0 };

  const genesisHash = '0'.repeat(64);

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // 检查 prevHash 链接
    const expectedPrev = i === 0 ? genesisHash : records[i - 1].hash;
    if (rec.prevHash !== expectedPrev) {
      return {
        valid: false,
        totalRecords: records.length,
        brokenAt: i,
        reason: `prevHash mismatch at record ${i}`,
      };
    }

    // 重算 hash 验证（eslint-disable-next-line: hash 仅用于从 payload 中排除）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hash, ...payload } = rec;
    const computed = sha256(JSON.stringify(payload));
    if (rec.hash !== computed) {
      return {
        valid: false,
        totalRecords: records.length,
        brokenAt: i,
        reason: `hash mismatch at record ${i}`,
      };
    }
  }

  return { valid: true, totalRecords: records.length };
}
