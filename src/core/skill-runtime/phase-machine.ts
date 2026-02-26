/**
 * 6-Phase Execution State Machine
 * P0_LOCATE → P1_CONTEXT → P2_GENERATE → P3_CONFIRM → P4_WRITE → P5_SIDE_EFFECT → DONE | ABORTED
 */
import { join } from 'node:path';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';

export type Phase =
  | 'P0_LOCATE'
  | 'P1_CONTEXT'
  | 'P2_GENERATE'
  | 'P3_CONFIRM'
  | 'P4_WRITE'
  | 'P5_SIDE_EFFECT'
  | 'DONE'
  | 'ABORTED';

export interface PhaseState {
  current: Phase;
  confirmed: boolean;
  revisionCount: number;
  maxRevisions: number;
}

/** 合法转换表 */
const TRANSITIONS: Record<Phase, Phase[]> = {
  P0_LOCATE: ['P1_CONTEXT'],
  P1_CONTEXT: ['P2_GENERATE'],
  P2_GENERATE: ['P3_CONFIRM'],
  P3_CONFIRM: ['P4_WRITE', 'P2_GENERATE', 'ABORTED'],
  P4_WRITE: ['P5_SIDE_EFFECT'],
  P5_SIDE_EFFECT: ['DONE'],
  DONE: [],
  ABORTED: [],
};

const MAX_REVISIONS = 5;
const ARCHIVE_THRESHOLD = 500;
const KEEP_LINES = 200;
const RISK_ARCHIVE_THRESHOLD = 200;
const ARCHIVE_RISK_MARKERS = [
  'FORCE_SKIPPED',
  'PASS_WITH_WAIVER',
  'Exception',
  '阻塞',
  '风险',
];

function shouldArchiveRuntimeFile(content: string, lines: string[]): boolean {
  if (lines.length > ARCHIVE_THRESHOLD) return true;
  if (lines.length <= RISK_ARCHIVE_THRESHOLD) return false;

  return ARCHIVE_RISK_MARKERS.some((marker) => content.includes(marker));
}

/** 创建初始状态 */
export function createPhaseState(): PhaseState {
  return {
    current: 'P0_LOCATE',
    confirmed: false,
    revisionCount: 0,
    maxRevisions: MAX_REVISIONS,
  };
}

/** 检查转换是否合法 */
export function canTransition(from: Phase, to: Phase): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** 执行状态转换 */
export function transition(state: PhaseState, to: Phase): PhaseState {
  if (!canTransition(state.current, to)) {
    throw new Error(`Illegal transition: ${state.current} → ${to}`);
  }

  const next = { ...state, current: to };

  // P3 → P2 修订反馈回滚
  if (state.current === 'P3_CONFIRM' && to === 'P2_GENERATE') {
    next.revisionCount = state.revisionCount + 1;
    next.confirmed = false;
    if (next.revisionCount > MAX_REVISIONS) {
      throw new Error(`Max revision rounds (${MAX_REVISIONS}) exceeded`);
    }
  }

  // P3 → P4 需要确认守卫
  if (state.current === 'P3_CONFIRM' && to === 'P4_WRITE') {
    if (!state.confirmed) {
      throw new Error('confirmationGuard: P3→P4 blocked — confirmation required');
    }
  }

  return next;
}

/** Phase 3 确认守卫：标记已确认 */
export function confirmPhase(state: PhaseState): PhaseState {
  if (state.current !== 'P3_CONFIRM') {
    throw new Error(`Cannot confirm in phase ${state.current}`);
  }
  return { ...state, confirmed: true };
}

/** P4 预守卫：检查运行态文件行数，超限自动归档 */
export function preWriteArchive(featureId: string, projectRoot: string): string[] {
  const archived: string[] = [];
  const files = ['findings.md', 'task_plan.md'];
  const now = new Date();
  const suffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${now.getTime()}`;

  for (const file of files) {
    const filePath = join(projectRoot, 'specs', featureId, file);
    if (!exists(filePath)) continue;

    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    if (!shouldArchiveRuntimeFile(content, lines)) continue;

    // 归档：重命名为 filename-YYYY-MM-DD-ts.md
    const archiveName = file.replace('.md', `-${suffix}.md`);
    const archivePath = join(projectRoot, 'specs', featureId, archiveName);
    // 保留最后 KEEP_LINES 行
    const kept = lines.slice(-KEEP_LINES).join('\n');
    const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    writeFileSync(tmpPath, kept, 'utf-8');
    renameSync(filePath, archivePath);
    renameSync(tmpPath, filePath);
    archived.push(file);
  }

  return archived;
}

/** 获取合法转换列表 */
export function getValidTransitions(phase: Phase): Phase[] {
  return TRANSITIONS[phase] ?? [];
}
