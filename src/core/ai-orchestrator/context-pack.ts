/**
 * Context Pack Builder
 * 双区结构：control (<2KB) + references，三层上下文 L1/L2/L3
 * Planning-with-Files P1-1: 接入 sliceContext 分层压缩
 */
import { join } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { StageState } from '../../shared/types.js';
import { readJson, exists, readMarkdown } from '../../shared/fs-utils.js';
import { sliceContext, type SliceResult } from './context-slicing.js';
import { loadConfig } from '../../shared/config-schema.js';

// ─── 类型定义 ─────────────────────────────────────────────

export interface ContextRef {
  path: string;
  selector?: string;
  reason: string;
  checksum: string;
  mtime: string;
  granularity?: 'summary' | 'detail';
  estimatedTokens?: number;
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
  budget: {
    total: number;
    controlSize: number;
    refsCount: number;
    tokenBudget: number;
    estimatedTokens: number;
    estimatedTokensRaw: number;
  };
  /** 分层压缩结果（Planning-with-Files P1-1） */
  slicing: SliceResult;
}

export interface ContextPackOptions {
  fullDetail?: boolean;
  expandPaths?: string[];
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
export function buildContextPack(
  featureId: string,
  projectRoot: string,
  options?: ContextPackOptions,
): ContextPack {
  const specDir = join(projectRoot, 'specs', featureId);
  const statePath = join(specDir, 'stage-state.json');
  const state = readJson<StageState>(statePath);
  const cfg = loadConfig(projectRoot);

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
  const rawRefs = buildReferences(featureId, projectRoot, state, options);

  // Planning-with-Files P1-1: 接入 sliceContext 分层压缩
  const sliceResult = sliceContext(rawRefs, {
    budgetTokens: cfg.context.token_budget,
    l1Ratio: 0.2,
    l2Ratio: 0.3,
    l3Ratio: 0.5,
  });

  return {
    version: '2.0',
    control,
    references: sliceResult.refs,
    budget: {
      total: controlSize + sliceResult.tokensAfter * 4,
      controlSize,
      refsCount: sliceResult.refs.length,
      tokenBudget: cfg.context.token_budget,
      estimatedTokens: sliceResult.tokensAfter,
      estimatedTokensRaw: sliceResult.tokensBefore,
    },
    slicing: sliceResult,
  };
}

/** 根据阶段构建 references 列表 */
function buildReferences(
  featureId: string,
  projectRoot: string,
  state: StageState,
  options?: ContextPackOptions,
): ContextRef[] {
  const specDir = join(projectRoot, 'specs', featureId);
  const layers = STAGE_LAYERS[state.currentStage] ?? { l1: ['constitution.md'], l2: [], l3: [] };
  const refs: ContextRef[] = [];
  const seen = new Set<string>();
  const expandPaths = new Set((options?.expandPaths ?? []).map((item) => item.trim()).filter(Boolean));
  const isExpanded = (relPath: string): boolean => {
    if (options?.fullDetail) return true;
    if (expandPaths.has(relPath)) return true;
    return Array.from(expandPaths).some((path) => relPath.startsWith(path));
  };

  // L1 + L2 + L3 合并
  const allPaths = [...layers.l1, ...layers.l2, ...layers.l3];

  for (const relPath of allPaths) {
    const fullPath = join(specDir, relPath);
    if (seen.has(relPath)) continue;
    seen.add(relPath);

    if (!exists(fullPath)) continue;

    const summaryRef = buildRef(fullPath, relPath, 'stage_context_summary', 'summary');
    if (summaryRef) refs.push(summaryRef);
    if (isExpanded(relPath)) {
      const detailRef = buildRef(fullPath, relPath, 'stage_context_detail', 'detail');
      if (detailRef) refs.push(detailRef);
    }
  }

  return refs;
}

function estimateTokens(input: string): number {
  return Math.max(1, Math.ceil(Buffer.byteLength(input, 'utf-8') / 4));
}

function summarizeContent(content: string): string {
  const lines = content.split('\n');
  const headings = lines.filter((line) => /^#{1,3}\s+/.test(line.trim())).slice(0, 8);
  if (headings.length > 0) {
    return headings.join('\n').slice(0, 1200);
  }
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24)
    .join('\n')
    .slice(0, 1200);
}

function buildRef(
  fullPath: string,
  relPath: string,
  reason: string,
  granularity: 'summary' | 'detail',
): ContextRef | null {
  try {
    const stat = statSync(fullPath);
    if (stat.isDirectory()) return null;

    const content = readFileSync(fullPath, 'utf-8');
    const payload = granularity === 'summary' ? summarizeContent(content) : content;
    const checksum = createHash('sha256').update(payload).digest('hex').slice(0, 16);

    return {
      path: relPath,
      selector: granularity,
      reason,
      checksum,
      mtime: stat.mtime.toISOString(),
      granularity,
      estimatedTokens: estimateTokens(payload),
    };
  } catch {
    return null;
  }
}

/** 验证 control zone 大小不超过 2KB */
export function validateControlSize(pack: ContextPack): boolean {
  return pack.budget.controlSize <= CONTROL_LIMIT;
}

// ─── Fresh Context Per Task（Planning-with-Files P2-1） ───────────────────────────

export interface TaskContextPack {
  taskId: string;
  featureId: string;
  taskContent: string;
  relatedFR: string[];
  relatedDS: string[];
  relatedAPI: string[];
  contextSize: number;
}

/** 构建 TASK 级独立上下文包（Planning-with-Files P2-1） */
export function buildTaskContextPack(
  taskId: string,
  featureId: string,
  projectRoot: string,
): TaskContextPack | null {
  const specDir = join(projectRoot, 'specs', featureId);
  const taskPlanPath = join(specDir, 'task_plan.md');

  if (!exists(taskPlanPath)) {
    return null;
  }

  // 1. 提取当前 TASK 内容
  const taskPlan = readMarkdown(taskPlanPath);
  const taskContent = extractTaskContent(taskPlan, taskId);
  if (!taskContent) {
    return null;
  }

  // 2. 从 traceability-matrix 提取关联的 FR/DS/API
  const matrixPath = join(specDir, 'traceability-matrix.md');
  const { relatedFR, relatedDS, relatedAPI } = exists(matrixPath)
    ? extractTaskTraces(readMarkdown(matrixPath), taskId)
    : { relatedFR: [], relatedDS: [], relatedAPI: [] };

  const pack: TaskContextPack = {
    taskId,
    featureId,
    taskContent,
    relatedFR,
    relatedDS,
    relatedAPI,
    contextSize: taskContent.length + JSON.stringify({ relatedFR, relatedDS, relatedAPI }).length,
  };

  // 3. 大小检查
  if (pack.contextSize > 2048) {
    console.warn(`[spec-first] TaskContextPack 超出建议大小（${pack.contextSize} > 2048 bytes）`);
  }

  return pack;
}

/** 从 task_plan.md 提取指定 TASK 的内容 */
function extractTaskContent(taskPlan: string, taskId: string): string | null {
  const lines = taskPlan.split('\n');
  let inTask = false;
  const contentLines: string[] = [];

  for (const line of lines) {
    // 检测 TASK 行开始
    if (line.includes(taskId)) {
      inTask = true;
      contentLines.push(line);
      continue;
    }

    // 收集内容直到遇到下一个 TASK- 行
    if (inTask) {
      // 检测是否到达下一个 TASK 行
      if (/TASK-[A-Z0-9-]+/.test(line) && !line.includes(taskId)) {
        break;
      }
      // 跳过表格分隔符行
      if (/^\|[-:\s|]+\|$/.test(line.trim())) {
        continue;
      }
      if (line.trim()) {
        contentLines.push(line);
      }
    }
  }

  return contentLines.length > 0 ? contentLines.join('\n') : null;
}

/** 从 traceability-matrix 提取 TASK 关联的 FR/DS/API */
function extractTaskTraces(
  matrix: string,
  taskId: string,
): { relatedFR: string[]; relatedDS: string[]; relatedAPI: string[] } {
  const relatedFR: string[] = [];
  const relatedDS: string[] = [];
  const relatedAPI: string[] = [];

  // 简化实现：按行查找包含 taskId 的行，并提取 upstream/downstream
  const lines = matrix.split('\n');
  for (const line of lines) {
    if (line.includes(taskId)) {
      // 提取 FR 引用
      const frMatches = line.match(/FR-[A-Z0-9-]+/g);
      if (frMatches) relatedFR.push(...frMatches);

      // 提取 DS 引用
      const dsMatches = line.match(/DS-[A-Z0-9-]+/g);
      if (dsMatches) relatedDS.push(...dsMatches);

      // 提取 API 引用（假设格式为 /api/xxx 或 API-XXX）
      const apiMatches = line.match(/\/api\/[a-zA-Z0-9-/]+|API-[A-Z0-9-]+/g);
      if (apiMatches) relatedAPI.push(...apiMatches);
    }
  }

  return {
    relatedFR: [...new Set(relatedFR)],
    relatedDS: [...new Set(relatedDS)],
    relatedAPI: [...new Set(relatedAPI)],
  };
}
