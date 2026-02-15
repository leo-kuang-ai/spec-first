/**
 * AI Statistics Recording
 * 记录每次 Skill 执行的 AI 调用统计到 ai-stats.jsonl
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { appendJsonl, exists } from '../../shared/fs-utils.js';

export interface AiStatEntry {
  timestamp: string;
  skill: string;
  taskId?: string;
  tokensIn: number;
  tokensOut: number;
  duration: number; // seconds
}

export interface AiStatsSummary {
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalDuration: number;
  bySkill: Record<string, { calls: number; tokensIn: number; tokensOut: number }>;
}

/** 记录一条 AI 统计 */
export function recordStat(featureId: string, projectRoot: string, entry: AiStatEntry): void {
  const statsPath = join(projectRoot, 'specs', featureId, 'ai-stats.jsonl');
  appendJsonl(statsPath, entry as unknown as Record<string, unknown>);
}

/** 读取所有统计记录 */
export function readStats(featureId: string, projectRoot: string): AiStatEntry[] {
  const statsPath = join(projectRoot, 'specs', featureId, 'ai-stats.jsonl');
  if (!exists(statsPath)) return [];

  const content = readFileSync(statsPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  const entries: AiStatEntry[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        entries.push(parsed as AiStatEntry);
      }
    } catch {
      // skip corrupted JSONL line
    }
  }

  return entries;
}

/** 汇总统计 */
export function summarizeStats(entries: AiStatEntry[]): AiStatsSummary {
  const bySkill: AiStatsSummary['bySkill'] = {};
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalDuration = 0;

  for (const e of entries) {
    totalTokensIn += e.tokensIn;
    totalTokensOut += e.tokensOut;
    totalDuration += e.duration;

    if (!bySkill[e.skill]) {
      bySkill[e.skill] = { calls: 0, tokensIn: 0, tokensOut: 0 };
    }
    bySkill[e.skill].calls++;
    bySkill[e.skill].tokensIn += e.tokensIn;
    bySkill[e.skill].tokensOut += e.tokensOut;
  }

  return {
    totalCalls: entries.length,
    totalTokensIn,
    totalTokensOut,
    totalDuration,
    bySkill,
  };
}
