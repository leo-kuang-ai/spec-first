/**
 * Context Pack Builder
 * 双区结构：control (<2KB) + references，三层上下文 L1/L2/L3
 */
import { join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Stage, StageState, Size } from '../../shared/types.js';
import { readJson, exists } from '../../shared/fs-utils.js';
import { parseMatrix } from '../trace-engine/matrix.js';

// ─── 类型定义 ─────────────────────────────────────────────

export interface ContextRef {
  path: string;
  selector?: string;
  reason: string;
  checksum: string;
  mtime: string;
}

export interface ControlZone {
  feature_meta: {
    id: string;
    title?: string;
    mode: string;
    size: string;
    platforms: string[];
  };
  constitution: string;
  current_phase: string;
  current_task?: string;
  artifacts: Record<string, string>;
}

export interface ContextPack {
  version: string;
  control: ControlZone;
  references: ContextRef[];
  budget: { total: number; controlSize: number; refsCount: number };
}

const CONTROL_LIMIT = 2048; // 2KB hard limit

// ─── 阶段×上下文映射 ─────────────────────────────────────

interface LayerDef {
  l1: string[];  // 始终加载
  l2: string[];  // 按阶段加载
  l3: string[];  // 矩阵关联
}

const STAGE_LAYERS: Partial<Record<string, LayerDef>> = {
  '01_specify': {
    l1: ['constitution.md'],
    l2: [],
    l3: ['spec.md'],
  },
  '02_design': {
    l1: ['constitution.md', 'spec.md'],
    l2: ['design.md'],
    l3: ['contracts/'],
  },
  '03_plan': {
    l1: ['constitution.md'],
    l2: ['spec.md', 'design.md'],
    l3: ['task_plan.md'],
  },
  '04_implement': {
    l1: ['constitution.md'],
    l2: ['spec.md', 'design.md', 'contracts/'],
    l3: ['task_plan.md'],
  },
  '05_verify': {
    l1: ['constitution.md'],
    l2: ['spec.md', 'design.md', 'task_plan.md'],
    l3: [],
  },
};

// ─── 核心构建函数 ─────────────────────────────────────────

/** 构建 Context Pack */
export function buildContextPack(featureId: string, projectRoot: string): ContextPack {
  const specDir = join(projectRoot, 'specs', featureId);
  const statePath = join(specDir, 'stage-state.json');
  const state = readJson<StageState>(statePath);

  // 构建 control zone
  const control: ControlZone = {
    feature_meta: {
      id: featureId,
      title: state.title,
      mode: state.mode,
      size: state.size,
      platforms: state.platforms,
    },
    constitution: 'constitution.md',
    current_phase: state.currentStage,
    artifacts: {
      matrix: `specs/${featureId}/traceability-matrix.md`,
    },
  };

  const controlJson = JSON.stringify(control);
  const controlSize = Buffer.byteLength(controlJson, 'utf-8');

  // 构建 references
  const refs = buildReferences(featureId, projectRoot, state);

  return {
    version: '2.0',
    control,
    references: refs,
    budget: { total: controlSize + refs.length * 100, controlSize, refsCount: refs.length },
  };
}

/** 根据阶段构建 references 列表 */
function buildReferences(featureId: string, projectRoot: string, state: StageState): ContextRef[] {
  const specDir = join(projectRoot, 'specs', featureId);
  const layers = STAGE_LAYERS[state.currentStage] ?? { l1: ['constitution.md'], l2: [], l3: [] };
  const refs: ContextRef[] = [];
  const seen = new Set<string>();

  // L1 + L2 + L3 合并
  const allPaths = [...layers.l1, ...layers.l2, ...layers.l3];

  for (const relPath of allPaths) {
    const fullPath = join(specDir, relPath);
    if (seen.has(relPath)) continue;
    seen.add(relPath);

    if (!exists(fullPath)) continue;

    const ref = buildRef(fullPath, relPath, 'stage_context');
    if (ref) refs.push(ref);
  }

  return refs;
}

function buildRef(fullPath: string, relPath: string, reason: string): ContextRef | null {
  try {
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return null;

    const content = readFileSync(fullPath, 'utf-8');
    const checksum = createHash('sha256').update(content).digest('hex').slice(0, 16);

    return {
      path: relPath,
      reason,
      checksum,
      mtime: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

/** 验证 control zone 大小不超过 2KB */
export function validateControlSize(pack: ContextPack): boolean {
  return pack.budget.controlSize <= CONTROL_LIMIT;
}
