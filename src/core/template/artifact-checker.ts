/**
 * 产出物完整性检查
 * 按 Mode×Size 检查并补全阶段产出物
 */
import { join } from 'node:path';
import type { Mode, Size, StageState } from '../../shared/types.js';
import { Stage } from '../../shared/types.js';
import { readJson, exists } from '../../shared/fs-utils.js';
import { renderTemplate, type TemplateContext } from './renderer.js';

// ─── 产出物定义 ────────────────────────────────────────

export type ArtifactStatus = 'present' | 'missing' | 'skipped';

export interface ArtifactEntry {
  name: string;
  path: string;
  status: ArtifactStatus;
  required: boolean;
}

export interface EnsureResult {
  checked: number;
  created: number;
  skipped: number;
  missing: string[];
}

interface ArtifactDef {
  /** 相对于 Feature 目录的路径 */
  relativePath: string;
  /** 适用阶段（产出物在哪个阶段开始要求） */
  stage: Stage;
  /** 跳过条件：返回 true 则跳过 */
  skipWhen?: (mode: Mode, size: Size) => boolean;
  /** 对应的模板名（如果有） */
  template?: string;
}

// ─── Mode×Size 跳过规则 ──────────────────────────────

const skipNS = (m: Mode, s: Size) => m === 'N' && s === 'S';
const skipNonI = (m: Mode) => m !== 'I';

/** 全量产出物定义表（按阶段归属） */
const ARTIFACT_DEFS: readonly ArtifactDef[] = [
  // 00_init
  { relativePath: 'stage-state.json', stage: Stage.INIT },
  { relativePath: 'constitution.md', stage: Stage.INIT, template: 'init/constitution.md' },
  { relativePath: 'traceability-matrix.md', stage: Stage.INIT, template: 'matrix/traceability-matrix.md' },
  { relativePath: 'findings.md', stage: Stage.INIT },
  { relativePath: 'task_plan.md', stage: Stage.INIT },
  // 01_specify
  { relativePath: 'prd.md', stage: Stage.SPECIFY },
  { relativePath: 'spec.md', stage: Stage.SPECIFY },
  // 02_design
  { relativePath: 'design.md', stage: Stage.DESIGN },
  { relativePath: 'research.md', stage: Stage.DESIGN, skipWhen: skipNS },
  { relativePath: 'data-model.md', stage: Stage.DESIGN, skipWhen: skipNS },
  { relativePath: 'contracts/', stage: Stage.DESIGN },
  { relativePath: 'adr/', stage: Stage.DESIGN, skipWhen: skipNS },
  { relativePath: 'impact-analysis.md', stage: Stage.DESIGN, skipWhen: (m) => skipNonI(m) },
  // 03_plan
  { relativePath: 'task_plan.md', stage: Stage.PLAN },
  // 04_implement — 代码产出物由开发者创建，不做模板渲染
  // 05_verify
  { relativePath: 'reports/test-report.md', stage: Stage.VERIFY },
  { relativePath: 'reports/security-scan.md', stage: Stage.VERIFY },
  { relativePath: 'reports/regression-report.md', stage: Stage.VERIFY, skipWhen: (m) => skipNonI(m) },
  { relativePath: 'reports/uat-signoff.md', stage: Stage.VERIFY },
  // 06_wrap_up
  { relativePath: 'retro.md', stage: Stage.WRAP_UP },
  // 07_release
  { relativePath: 'reports/release-note.md', stage: Stage.RELEASE, template: 'release/release-note.md' },
  { relativePath: 'reports/smoke-test-report.md', stage: Stage.RELEASE, template: 'release/smoke-test-report.md' },
];

// ─── 阶段顺序（用于判定"当前阶段及之前"） ─────────────

const STAGE_ORDER: readonly Stage[] = [
  Stage.INIT, Stage.SPECIFY, Stage.DESIGN, Stage.PLAN,
  Stage.IMPLEMENT, Stage.VERIFY, Stage.WRAP_UP, Stage.RELEASE,
  Stage.DONE, Stage.CANCELLED,
];

function stageIndex(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

// ─── 路径工具 ────────────────────────────────────────

function featureDir(projectRoot: string, featureId: string): string {
  return join(projectRoot, 'specs', featureId);
}

function loadStageState(projectRoot: string, featureId: string): StageState {
  const p = join(featureDir(projectRoot, featureId), 'stage-state.json');
  if (!exists(p)) {
    throw new Error(`stage-state.json not found for ${featureId}`);
  }
  return readJson<StageState>(p);
}

// ─── 核心函数 ────────────────────────────────────────

/**
 * 检查并补全当前阶段及之前的必须产出物
 * 缺失且有模板的产出物会自动渲染骨架
 */
export function ensureArtifacts(
  featureId: string,
  projectRoot: string,
): EnsureResult {
  const state = loadStageState(projectRoot, featureId);
  const currentIdx = stageIndex(state.currentStage);
  const featDir = featureDir(projectRoot, featureId);

  let checked = 0;
  let created = 0;
  let skipped = 0;
  const missing: string[] = [];

  for (const def of ARTIFACT_DEFS) {
    // 只检查当前阶段及之前的产出物
    if (stageIndex(def.stage) > currentIdx) continue;

    // 跳过条件
    if (def.skipWhen?.(state.mode, state.size)) {
      skipped++;
      continue;
    }

    checked++;
    const fullPath = join(featDir, def.relativePath);

    if (exists(fullPath)) continue;

    // 有模板则渲染骨架
    if (def.template) {
      const ctx: TemplateContext = {
        featureId,
        title: featureId,
        mode: state.mode,
        size: state.size,
        platforms: state.platforms,
        timestamp: new Date().toISOString(),
        author: 'system',
      };
      renderTemplate(def.template, ctx, fullPath, projectRoot);
      created++;
    } else {
      missing.push(def.relativePath);
    }
  }

  return { checked, created, skipped, missing };
}

/**
 * 列出 Feature 下所有产出物及状态
 */
export function listArtifacts(
  featureId: string,
  projectRoot: string,
): ArtifactEntry[] {
  const state = loadStageState(projectRoot, featureId);
  const featDir = featureDir(projectRoot, featureId);
  const result: ArtifactEntry[] = [];

  for (const def of ARTIFACT_DEFS) {
    const isSkipped = def.skipWhen?.(state.mode, state.size) ?? false;
    const fullPath = join(featDir, def.relativePath);
    const isPresent = exists(fullPath);

    let status: ArtifactStatus;
    if (isSkipped) {
      status = 'skipped';
    } else if (isPresent) {
      status = 'present';
    } else {
      status = 'missing';
    }

    result.push({
      name: def.relativePath,
      path: fullPath,
      status,
      required: !isSkipped,
    });
  }

  return result;
}
