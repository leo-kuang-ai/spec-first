import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StageState } from '../../shared/types.js';
import { exists, readJson } from '../../shared/fs-utils.js';

const MANAGED_BEGIN = '<!-- SPEC-FIRST:BEGIN AUTO-CONTEXT -->';
const MANAGED_END = '<!-- SPEC-FIRST:END AUTO-CONTEXT -->';
const MANUAL_BEGIN = '<!-- SPEC-FIRST:BEGIN MANUAL -->';
const MANUAL_END = '<!-- SPEC-FIRST:END MANUAL -->';

export interface ContextSyncResult {
  updated: string[];
  skipped: string[];
  warnings: string[];
}

function extractDesignSummary(designPath: string): string[] {
  if (!exists(designPath)) return ['- design.md 缺失，待补齐后重试同步'];
  const content = readFileSync(designPath, 'utf-8');
  const headings = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{1,3}\s+/.test(line))
    .slice(0, 8);
  if (headings.length === 0) return ['- design.md 未识别到标题，建议补充结构化章节'];
  return headings.map((line) => `- ${line.replace(/^#+\s*/, '')}`);
}

function renderManagedContext(
  featureId: string,
  state: StageState,
  designSummary: string[]
): string {
  const now = new Date().toISOString();
  return [
    MANAGED_BEGIN,
    `> Auto-synced at ${now}`,
    '',
    '## Spec-First Context Snapshot',
    `- Feature: ${featureId}`,
    `- Stage: ${state.currentStage}`,
    `- Design: specs/${featureId}/design.md`,
    '',
    '### Design Highlights',
    ...designSummary,
    MANAGED_END,
    '',
  ].join('\n');
}

function ensureManualBlock(content: string): string {
  if (content.includes(MANUAL_BEGIN) && content.includes(MANUAL_END)) return content;
  return `${content.trimEnd()}\n\n${MANUAL_BEGIN}\n<!-- 手动补充上下文，请保留此块 -->\n${MANUAL_END}\n`;
}

function upsertManagedBlock(content: string, managedBlock: string): string {
  const begin = content.indexOf(MANAGED_BEGIN);
  const end = content.indexOf(MANAGED_END);
  if (begin >= 0 && end > begin) {
    const tailStart = end + MANAGED_END.length;
    return `${content.slice(0, begin).trimEnd()}\n\n${managedBlock}${content.slice(tailStart).replace(/^\n+/, '\n')}`;
  }
  return `${content.trimEnd()}\n\n${managedBlock}`;
}

export function syncAgentContextFromDesign(
  featureId: string,
  projectRoot: string
): ContextSyncResult {
  const result: ContextSyncResult = { updated: [], skipped: [], warnings: [] };
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  const designPath = join(projectRoot, 'specs', featureId, 'design.md');
  if (!exists(statePath)) {
    result.warnings.push(`stage-state.json 缺失：${statePath}`);
    return result;
  }

  const state = readJson<StageState>(statePath);
  const summary = extractDesignSummary(designPath);
  const managed = renderManagedContext(featureId, state, summary);
  const targets = [join(projectRoot, 'CLAUDE.md'), join(projectRoot, 'AGENTS.md')];

  for (const target of targets) {
    if (!exists(target)) {
      result.skipped.push(target);
      continue;
    }
    try {
      const original = readFileSync(target, 'utf-8');
      const withManual = ensureManualBlock(original);
      const next = upsertManagedBlock(withManual, managed);
      if (next !== original) {
        writeFileSync(target, next, 'utf-8');
        result.updated.push(target);
      } else {
        result.skipped.push(target);
      }
    } catch (error) {
      result.warnings.push(`${target}: ${(error as Error).message}`);
    }
  }

  return result;
}
