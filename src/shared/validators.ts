/**
 * I3: 关键类型运行时 shape check
 * 用于 readJsonChecked 的 guard 函数
 */
import type { StageState, RfcRecord, DefectRecord } from './types.js';

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export function isStageState(data: unknown): data is StageState {
  if (!isObj(data)) return false;
  return typeof data.currentStage === 'string';
}

export function isRfcRecord(data: unknown): data is RfcRecord {
  if (!isObj(data)) return false;
  return typeof data.id === 'string'
    && typeof data.featureId === 'string'
    && typeof data.status === 'string'
    && typeof data.by === 'string';
}

export function isDefectRecord(data: unknown): data is DefectRecord {
  if (!isObj(data)) return false;
  return typeof data.featureId === 'string'
    && typeof data.severity === 'string'
    && typeof data.status === 'string'
    && typeof data.reporter === 'string';
}
