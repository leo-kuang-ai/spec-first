/**
 * Feature 初始化
 * 生成 Feature ID → 创建目录 → 渲染状态 → 初始化骨架文件 → 注册缩写
 */
import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { Mode, Size, StageState } from '../../shared/types.js';
import {
  writeJson,
  writeMarkdown,
  readMarkdown,
  ensureDir,
  exists,
} from '../../shared/fs-utils.js';
import { renderDefaultConfigYaml, resetConfigCache } from '../../shared/config-schema.js';
import { mergeLayerRules } from './layer-merger.js';
import type { MergedRules } from './layer-merger.js';

// ─── 类型 ────────────────────────────────────────────────

export interface InitOptions {
  feat: string;
  title: string;
  mode: Mode;
  size: Size;
  platforms: string[];
  author: string;
  /** 用户指定 Feature ID（可选，缺省自动生成） */
  featureId?: string;
  projectRoot: string;
}

export interface InitResult {
  featureId: string;
  featureDir: string;
  mergedRules: MergedRules;
}

// ─── FEAT 缩写校验 ──────────────────────────────────────

function validateFeat(feat: string): void {
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(feat)) {
    throw new Error(
      `无效 FEAT 缩写 "${feat}"：必须为 1-16 位、以 A-Z 开头、且仅包含 A-Z0-9`,
    );
  }
}

// ─── Feature ID 生成 ─────────────────────────────────────

/** 扫描 specs/ 下已有 Feature 目录，提取同缩写最大序号 */
function findNextFeatureSeq(specsDir: string, feat: string): number {
  if (!exists(specsDir)) return 1;

  const prefix = `FSREQ-`;
  const suffix = `-${feat}-`;
  let maxSeq = 0;

  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (!name.startsWith(prefix) || !name.includes(suffix)) continue;

    // FSREQ-YYYYMMDD-FEAT-NNN
    const parts = name.split('-');
    const seqStr = parts[parts.length - 1];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }

  return maxSeq + 1;
}

function generateFeatureId(feat: string, specsDir: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const seq = findNextFeatureSeq(specsDir, feat);
  const seqStr = String(seq).padStart(3, '0');

  return `FSREQ-${dateStr}-${feat}-${seqStr}`;
}

// ─── FEAT 注册表 ─────────────────────────────────────────

const REGISTRY_FILE = '.feat-registry.md';

function loadRegistry(specsDir: string): Map<string, string> {
  const regPath = join(specsDir, REGISTRY_FILE);
  const map = new Map<string, string>();
  if (!exists(regPath)) return map;

  const content = readMarkdown(regPath);
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.startsWith('|--') || trimmed.startsWith('| FEAT')) {
      continue;
    }
    const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length >= 2 && cells[0]) {
      map.set(cells[0], cells[1]);
    }
  }
  return map;
}

function registerFeat(specsDir: string, feat: string, featureId: string): void {
  const regPath = join(specsDir, REGISTRY_FILE);

  if (!exists(regPath)) {
    const header =
      '# FEAT 缩写注册表\n\n'
      + '| FEAT | Feature ID |\n'
      + '|------|------------|\n';
    writeMarkdown(regPath, header);
  }

  const content = readMarkdown(regPath);
  const newRow = `| ${feat} | ${featureId} |\n`;
  writeMarkdown(regPath, content + newRow);
}

// ─── 骨架文件生成 ────────────────────────────────────────

function skeletonProgress(featureId: string, title: string, author: string): string {
  return `# Progress — ${featureId}\n\n`
    + `> ${title}\n\n`
    + `## 进度记录\n\n`
    + `| 日期 | 阶段 | 事项 | 作者 |\n`
    + `|------|------|------|------|\n`
    + `| ${new Date().toISOString().slice(0, 10)} | 00_init | Feature 初始化 | ${author} |\n`;
}

function skeletonFindings(featureId: string): string {
  return `# Findings — ${featureId}\n\n`
    + `## 过程发现\n\n`
    + `> 记录 Gate 校验、Force 跳过、Pilot 降级等过程事件。\n\n`
    + `| 时间 | 阶段 | 类型 | 描述 |\n`
    + `|------|------|------|------|\n`;
}

function skeletonTaskPlan(featureId: string, title: string): string {
  return `# Task Plan — ${featureId}\n\n`
    + `> ${title}\n\n`
    + `## 任务列表\n\n`
    + `> 03_plan 阶段完成拆解。\n\n`
    + `| # | Task ID | 标题 | 状态 | 负责人 |\n`
    + `|---|---------|------|------|--------|\n`;
}

function skeletonMatrix(): string {
  return '| ID | Type | Title | Status | Upstream | Downstream |\n'
    + '|----|------|-------|--------|----------|------------|\n';
}

function skeletonConstitution(featureId: string, projectRoot: string): string {
  const globalPath = join(projectRoot, '.spec-first', 'constitution.md');
  if (exists(globalPath)) {
    return readMarkdown(globalPath);
  }
  return `# Constitution — ${featureId}\n\n`
    + `> 项目宪法副本。请在 .spec-first/constitution.md 中维护主版本。\n`;
}

function ensureProjectConfig(projectRoot: string): void {
  const specFirstDir = join(projectRoot, '.spec-first');
  const configPath = join(specFirstDir, 'config.yaml');
  ensureDir(specFirstDir);
  let wroteConfig = false;
  if (!exists(configPath)) {
    writeMarkdown(configPath, renderDefaultConfigYaml());
    wroteConfig = true;
  }
  if (wroteConfig) {
    resetConfigCache();
  }
}

// ─── 主逻辑 ──────────────────────────────────────────────

/**
 * Feature 初始化
 * 幂等：已存在的 Feature 不覆盖，直接返回
 */
export function init(opts: InitOptions): InitResult {
  validateFeat(opts.feat);

  const specsDir = join(opts.projectRoot, 'specs');
  ensureDir(specsDir);
  ensureProjectConfig(opts.projectRoot);

  // FEAT 缩写唯一性检查
  const registry = loadRegistry(specsDir);
  const existingId = registry.get(opts.feat);

  // 生成或使用指定的 Feature ID
  const featureId = opts.featureId ?? generateFeatureId(opts.feat, specsDir);
  const featureDir = join(specsDir, featureId);

  // 幂等：已存在则直接返回
  if (exists(featureDir)) {
    const mergedRules = mergeLayerRules(opts.mode, opts.size, opts.platforms, opts.projectRoot);
    return { featureId, featureDir, mergedRules };
  }

  // FEAT 已被其他 Feature 注册
  if (existingId && existingId !== featureId) {
    throw new Error(
      `FEAT 缩写 "${opts.feat}" 已被注册到 ${existingId}`,
    );
  }

  // 三层合并
  const mergedRules = mergeLayerRules(opts.mode, opts.size, opts.platforms, opts.projectRoot);

  // 创建目录
  ensureDir(featureDir);
  ensureDir(join(featureDir, 'reports'));
  ensureDir(join(featureDir, 'contracts'));
  ensureDir(join(featureDir, 'tests'));

  const now = new Date().toISOString();

  // stage-state.json
  const state: StageState = {
    featureId,
    mode: opts.mode,
    size: opts.size,
    platforms: opts.platforms,
    mergedRules: {
      gateConditions: mergedRules.gateConditions as Record<string, unknown[]>,
      deliverables: mergedRules.deliverables as Record<string, unknown[]>,
      thresholds: mergedRules.thresholds,
    },
    currentStage: Stage.INIT,
    history: [],
    terminal: false,
    title: opts.title,
    createdAt: now,
    updatedAt: now,
  };
  writeJson(join(featureDir, 'stage-state.json'), state);

  // 运行态三文件
  writeMarkdown(join(featureDir, 'progress.md'), skeletonProgress(featureId, opts.title, opts.author));
  writeMarkdown(join(featureDir, 'findings.md'), skeletonFindings(featureId));
  writeMarkdown(join(featureDir, 'task_plan.md'), skeletonTaskPlan(featureId, opts.title));

  // traceability-matrix.md
  writeMarkdown(join(featureDir, 'traceability-matrix.md'), skeletonMatrix());

  // constitution.md 副本
  writeMarkdown(join(featureDir, 'constitution.md'), skeletonConstitution(featureId, opts.projectRoot));

  // .spec-first/current
  const currentPath = join(opts.projectRoot, '.spec-first', 'current');
  ensureDir(join(opts.projectRoot, '.spec-first'));
  writeMarkdown(currentPath, `${featureId}\n`);

  // 注册 FEAT 缩写
  if (!existingId) {
    registerFeat(specsDir, opts.feat, featureId);
  }

  return { featureId, featureDir, mergedRules };
}
