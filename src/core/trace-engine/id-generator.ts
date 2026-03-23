/**
 * ID 生成与注册
 * 扫描源文档内容 + 预留登记，避免依赖外部关系表。
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { NextIdType, TcLevel } from '../../shared/types.js';
import { exists, readJson, readMarkdown, writeJson } from '../../shared/fs-utils.js';
import { withFileLock } from '../../shared/file-lock.js';
import { validateId } from './id-validator.js';
import { ID_SCAN_PATTERN } from './id-taxonomy.js';

export interface NextIdOptions {
  type: NextIdType;
  abbr: string;
  featureId: string;
  tcLevel?: TcLevel;
  projectRoot: string;
}

export interface NextIdResult {
  id: string;
  seq: number;
}

export function nextId(opts: NextIdOptions): NextIdResult {
  return withFileLock(join(opts.projectRoot, 'specs', opts.featureId, '.id.lock'), () => {
    validateAbbr(opts.abbr);
    if (opts.type === 'TC' && !opts.tcLevel) {
      throw new Error('TC 类型必须提供 tcLevel（UT|IT|E2E|ST）');
    }

    const existingIds = collectKnownIds(opts.projectRoot, opts.featureId);
    const seq = findNextSeq(existingIds, opts.type, opts.abbr, opts.tcLevel);
    const id = assembleId(opts.type, opts.abbr, seq, opts.tcLevel);
    const validation = validateId(id);
    if (!validation.valid) {
      throw new Error(`生成了无效 ID：${id} — ${validation.error}`);
    }

    reserveId(opts.projectRoot, opts.featureId, id);
    return { id, seq };
  });
}

function validateAbbr(abbr: string): void {
  const normalized = abbr.replace(/-/g, '');
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(normalized)) {
    throw new Error(`无效缩写 "${abbr}"：移除连字符后必须为 1-16 位、以 A-Z 开头、且仅包含 A-Z0-9`);
  }
}

function assembleId(type: NextIdType, abbr: string, seq: number, tcLevel?: TcLevel): string {
  const normalizedAbbr = abbr.replace(/-/g, '');
  const seqStr = String(seq).padStart(3, '0');
  if (type === 'TC') {
    return `TC-${tcLevel!}-${normalizedAbbr}-${seqStr}`;
  }
  if (type === 'RFC') {
    return `RFC-${seqStr}`;
  }
  return `${type}-${normalizedAbbr}-${seqStr}`;
}

function findNextSeq(ids: string[], type: NextIdType, abbr: string, tcLevel?: TcLevel): number {
  let maxSeq = 0;
  for (const id of ids) {
    const seq = extractSeq(id, type, abbr, tcLevel);
    if (seq !== null && seq > maxSeq) {
      maxSeq = seq;
    }
  }
  return maxSeq + 1;
}

function extractSeq(id: string, type: NextIdType, abbr: string, tcLevel?: TcLevel): number | null {
  const normalizedAbbr = abbr.replace(/-/g, '');
  let prefix: string;
  if (type === 'TC') {
    prefix = `TC-${tcLevel!}-${normalizedAbbr}-`;
  } else if (type === 'RFC') {
    prefix = 'RFC-';
  } else {
    prefix = `${type}-${normalizedAbbr}-`;
  }
  if (!id.startsWith(prefix)) return null;
  const seq = Number.parseInt(id.slice(prefix.length), 10);
  return Number.isNaN(seq) ? null : seq;
}

export function collectKnownIds(projectRoot: string, featureId: string): string[] {
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!exists(featureDir)) return [];

  const ids = new Set<string>();
  for (const relativePath of walkFeatureTextFiles(featureDir, '')) {
    const fullPath = join(featureDir, relativePath);
    const content = readMarkdown(fullPath);
    const matches = content.match(ID_SCAN_PATTERN) ?? [];
    for (const match of matches) {
      const validation = validateId(match);
      if (validation.valid) ids.add(match);
    }
  }

  for (const reservedId of readReservations(projectRoot, featureId)) {
    ids.add(reservedId);
  }

  return [...ids].sort();
}

function reserveId(projectRoot: string, featureId: string, id: string): void {
  const reservationPath = getReservationPath(projectRoot, featureId);
  const reservedIds = new Set(readReservations(projectRoot, featureId));
  reservedIds.add(id);
  writeJson(reservationPath, { reservedIds: [...reservedIds].sort() });
}

function readReservations(projectRoot: string, featureId: string): string[] {
  const reservationPath = getReservationPath(projectRoot, featureId);
  if (!exists(reservationPath)) return [];
  try {
    const parsed = readJson<{ reservedIds?: unknown }>(reservationPath);
    return Array.isArray(parsed.reservedIds)
      ? parsed.reservedIds.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function getReservationPath(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId, '.id-reservations.json');
}

function walkFeatureTextFiles(root: string, relativePath: string): string[] {
  const currentPath = relativePath ? join(root, relativePath) : root;
  const results: string[] = [];
  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const nextRelativePath = relativePath ? join(relativePath, entry.name) : entry.name;
    if (entry.isDirectory()) {
      results.push(...walkFeatureTextFiles(root, nextRelativePath));
      continue;
    }
    if (!/\.(md|ya?ml|json)$/i.test(entry.name)) continue;
    results.push(nextRelativePath);
  }
  return results;
}
