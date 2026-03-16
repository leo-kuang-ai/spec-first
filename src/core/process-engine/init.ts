/**
 * Feature 初始化
 * 生成 Feature ID → 创建目录 → 渲染状态 → 初始化骨架文件 → 注册缩写
 */
import { join } from 'node:path';
import {
  closeSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { BackgroundInputStatus, Mode, Size, StageState } from '../../shared/types.js';
import {
  writeJson,
  writeMarkdown,
  readMarkdown,
  ensureDir,
  exists,
  parseMarkdownTable,
} from '../../shared/fs-utils.js';
import { renderDefaultConfigYaml, resetConfigCache } from '../../shared/config-schema.js';
import { mergeLayerRules } from './layer-merger.js';
import type { MergedRules } from './layer-merger.js';
import { renderToString } from '../template/renderer.js';
import type { TemplateContext } from '../template/renderer.js';
import { detectBackgroundInputStatus } from '../skill-runtime/first-context.js';

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
  backgroundInputStatus: BackgroundInputStatus;
}

// ─── FEAT 缩写校验 ──────────────────────────────────────

function validateFeat(feat: string): void {
  if (!/^[A-Z][A-Z0-9]{0,15}$/.test(feat)) {
    throw new Error(`无效 FEAT 缩写 "${feat}"：必须为 1-16 位、以 A-Z 开头、且仅包含 A-Z0-9`);
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
const REGISTRY_LOCK_FILE = '.feat-registry.lock';
const REGISTRY_LOCK_TIMEOUT_MS = 3_000;
const REGISTRY_LOCK_RETRY_MS = 50;
const REGISTRY_LOCK_STALE_MS = 30_000;

function sleepMs(ms: number): void {
  const lock = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(lock, 0, 0, ms);
}

function releaseRegistryLock(lockFd: number, lockPath: string): void {
  closeSync(lockFd);
  try {
    unlinkSync(lockPath);
  } catch {
    // ignore unlock cleanup failure
  }
}

function shouldRetryRegistryLock(error: unknown, lockPath: string, startAt: number): boolean {
  const err = error as NodeJS.ErrnoException;
  if (err.code !== 'EEXIST') throw error;
  if (tryRecoverStaleRegistryLock(lockPath)) return true;
  if (Date.now() - startAt >= REGISTRY_LOCK_TIMEOUT_MS) {
    throw new Error(`获取 FEAT 注册表锁超时：${lockPath}`);
  }
  sleepMs(REGISTRY_LOCK_RETRY_MS);
  return true;
}

function withRegistryLock<T>(specsDir: string, action: () => T): T {
  const lockPath = join(specsDir, REGISTRY_LOCK_FILE);
  const start = Date.now();

  while (true) {
    try {
      const lockFd = openSync(lockPath, 'wx');
      try {
        writeRegistryLockPayload(lockPath);
        return action();
      } finally {
        releaseRegistryLock(lockFd, lockPath);
      }
    } catch (error) {
      shouldRetryRegistryLock(error, lockPath, start);
    }
  }
}

function loadRegistry(specsDir: string): Map<string, string> {
  const regPath = join(specsDir, REGISTRY_FILE);
  const map = new Map<string, string>();
  if (!exists(regPath)) return map;

  const content = readMarkdown(regPath);
  for (const cells of parseMarkdownTable(content)) {
    if (cells.length >= 2 && cells[0]) {
      map.set(cells[0], cells[1]);
    }
  }
  return map;
}

function registerFeat(specsDir: string, feat: string, featureId: string): void {
  withRegistryLock(specsDir, () => {
    registerFeatUnlocked(specsDir, feat, featureId);
  });
}

function registerFeatUnlocked(specsDir: string, feat: string, featureId: string): void {
  const regPath = join(specsDir, REGISTRY_FILE);

  if (!exists(regPath)) {
    const header = '# FEAT 缩写注册表\n\n' + '| FEAT | Feature ID |\n' + '|------|------------|\n';
    writeMarkdown(regPath, header);
  }

  const latest = loadRegistry(specsDir);
  const existingId = latest.get(feat);
  if (existingId && existingId !== featureId) {
    throw new Error(`FEAT 缩写 "${feat}" 已被注册到 ${existingId}`);
  }
  if (existingId === featureId) {
    return;
  }

  const content = readMarkdown(regPath);
  const newRow = `| ${feat} | ${featureId} |\n`;
  writeMarkdown(regPath, content + newRow);
}

function writeRegistryLockPayload(lockPath: string): void {
  try {
    writeFileSync(
      lockPath,
      `${JSON.stringify({ pid: process.pid, createdAt: Date.now() })}\n`,
      'utf-8'
    );
  } catch {
    // ignore payload write failure; lock ownership is still valid
  }
}

function tryRecoverStaleRegistryLock(lockPath: string): boolean {
  const payload = readRegistryLockPayload(lockPath);
  const createdAt = payload?.createdAt ?? readRegistryLockMtime(lockPath);
  const staleByAge = createdAt > 0 && Date.now() - createdAt >= REGISTRY_LOCK_STALE_MS;
  const staleByPid =
    typeof payload?.pid === 'number' && payload.pid > 0 && !isProcessAlive(payload.pid);

  if (!staleByAge && !staleByPid) return false;

  try {
    unlinkSync(lockPath);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return err.code === 'ENOENT';
  }
}

function readRegistryLockPayload(
  lockPath: string
): { pid?: number; createdAt?: number } | undefined {
  try {
    const raw = readFileSync(lockPath, 'utf-8').trim();
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      pid: typeof parsed.pid === 'number' ? parsed.pid : undefined,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : undefined,
    };
  } catch {
    return undefined;
  }
}

function readRegistryLockMtime(lockPath: string): number {
  try {
    return statSync(lockPath).mtimeMs;
  } catch {
    return 0;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return err.code !== 'ESRCH';
  }
}

// ─── 骨架文件生成 ────────────────────────────────────────

function skeletonFindings(featureId: string): string {
  return (
    `# Findings & Decisions — ${featureId}

` +
    `## Plan Summary

` +
    `| Field | Value |
` +
    `|------|-------|
` +
    `| Target Stage | 01_specify |
` +
    `| Next Action | 补齐规格并推进当前阶段 |
` +
    `| Blockers | none |
` +
    `| Risk Level | LOW |
` +
    `| Suggested Command | /spec-first:spec |

` +
    `## Decision Log

` +
    `| Time | Stage | Decision | Rationale |
` +
    `|------|-------|----------|-----------|

` +
    `## Execution Evidence

` +
    `| Time | Type | Evidence | Result |
` +
    `|------|------|----------|--------|

` +
    `## Risks & Blockers

` +
    `- None

` +
    `## Next Steps

` +
    `1. 执行 /spec-first:spec
`
  );
}

function skeletonTaskPlan(featureId: string, title: string): string {
  return (
    `# Task Plan — ${featureId}

` +
    `> ${title}

` +
    `## 任务明细

` +
    `| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |
` +
    `|---|---|---|---|---|---|---|---|---|
` +
    `| TASK-XXX-001 | 初始化基础骨架 | dev | 0.5d | FR-XXX-001 | - | CLI 可初始化并生成骨架 | pnpm test -- tests/unit/init.test.ts | todo |

` +
    `## 实施步骤

` +
    `### TASK-XXX-001 — 初始化基础骨架

` +
    `1. 建立最小骨架与目录
` +
    `2. 补齐追踪关系与必要文档
` +
    `3. 记录关键结论到 findings.md

` +
    `## 验证命令

` +
    `- pnpm test -- tests/unit/init.test.ts
`
  );
}

function skeletonMatrix(): string {
  return (
    '| ID | Type | Title | Status | Upstream | Downstream |\n' +
    '|----|------|-------|--------|----------|------------|\n'
  );
}

function skeletonPrd(featureId: string, title: string): string {
  const today = new Date().toISOString();
  return `---
scenario: "待判定"
scenario_reason: ""
evidence_paths: []
complexity: "待判定"
created_at: "${today}"
last_updated: "${today}"
---

# PRD — ${featureId}

> ${title}

## 1. 业务目标

### 1.1 问题陈述

**当前痛点**：
[描述用户当前遇到的问题或痛点]

**目标用户**：
[描述目标用户群体]

**使用场景**：
[描述用户在什么场景下会使用这个功能]

### 1.2 业务价值

**预期收益**：
- [收益 1]
- [收益 2]

**成功指标**：
- [指标 1]: [目标值]
- [指标 2]: [目标值]

## 2. 功能需求

### 2.1 核心功能

- [功能 1]
- [功能 2]

### 2.2 用户故事

- 作为 [角色]，我希望 [能力]，以便 [价值]
- 作为 [角色]，我希望 [能力]，以便 [价值]

## 3. 非功能需求

### 3.1 性能需求

- [性能要求 1]
- [性能要求 2]

### 3.2 安全与合规

- [安全要求 1]
- [合规要求 1]

## 4. 验收与成功标准

- [ ] 所有核心功能已实现
- [ ] 质量标准达标
- [ ] 业务指标达标

## 5. 开放问题

| 问题 | 优先级 | 负责人 | 状态 |
|------|--------|--------|------|
| [问题 1] | High/Medium/Low | [姓名] | Open/Resolved |
`;
}

/**
 * Baseline-specific PRD skeleton for FSREQ-19700101-LEGACY-BASELINE.
 * Contains 已上线能力摘要 section instead of standard business goals.
 */
export function skeletonPrdBaseline(featureId: string, title: string): string {
  const today = new Date().toISOString();
  return `---
scenario: "brownfield-baseline"
scenario_reason: "存量系统现状能力盘点"
evidence_paths: []
complexity: "待判定"
created_at: "${today}"
last_updated: "${today}"
---

# PRD — ${featureId}

> ${title}

## 1. 已上线能力摘要

### 1.1 现有功能盘点

**核心模块**：
[列出已上线的核心业务模块]

**技术栈**：
[描述当前系统技术栈]

**集成点**：
[列出外部系统集成点]

### 1.2 能力缺口分析

**已知问题**：
- [问题 1]
- [问题 2]

**待补齐能力**：
- [能力 1]
- [能力 2]

## 2. 基线范围

### 2.1 纳入范围

- [模块 1]
- [模块 2]

### 2.2 排除范围

- [明确排除的内容]

## 3. 验收标准

- [ ] 所有核心模块已完成现状盘点
- [ ] 能力缺口已识别并记录
- [ ] 基线文档已完成评审

## 4. 开放问题

| 问题 | 优先级 | 负责人 | 状态 |
|------|--------|--------|------|
| [问题 1] | High/Medium/Low | [姓名] | Open/Resolved |
`;
}

/**
 * Baseline-specific task_plan skeleton for FSREQ-19700101-LEGACY-BASELINE.
 * Contains 基线补齐 section instead of standard task breakdown.
 */
export function skeletonTaskPlanBaseline(featureId: string, title: string): string {
  return (
    `# Task Plan — ${featureId}\n\n` +
    `> ${title}\n\n` +
    `## 基线补齐\n\n` +
    `| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 验证命令 | 状态 |\n` +
    `|---|---|---|---|---|---|---|---|---|\n` +
    `| TASK-LEGACY-001 | 现有能力盘点 | dev | 1d | - | - | 能力清单完整 | - | todo |\n` +
    `| TASK-LEGACY-002 | 技术债务识别 | dev | 0.5d | - | TASK-LEGACY-001 | 问题清单完整 | - | todo |\n\n` +
    `## 实施步骤\n\n` +
    `### TASK-LEGACY-001 — 现有能力盘点\n\n` +
    `1. 梳理现有模块清单\n` +
    `2. 记录 API 端点与数据模型\n` +
    `3. 更新 findings.md\n\n` +
    `## 验证命令\n\n` +
    `- 人工评审基线文档完整性\n`
  );
}

/**
 * Impact analysis skeleton for Mode I (Iteration) Features.
 * Scaffolds sections for change scope assessment and risk evaluation.
 */
function skeletonImpactAnalysis(featureId: string, title: string): string {
  return (
    `# Impact Analysis — ${featureId}\n\n` +
    `> ${title}\n\n` +
    `## 1. 变更范围\n\n` +
    `### 1.1 受影响模块\n\n` +
    `| 模块 | 变更类型 | 影响程度 | 说明 |\n` +
    `|------|---------|---------|------|\n` +
    `| [模块名] | 新增/修改/删除 | 高/中/低 | [说明] |\n\n` +
    `### 1.2 受影响 API\n\n` +
    `| API | 变更类型 | 兼容性 | 说明 |\n` +
    `|-----|---------|--------|------|\n` +
    `| [接口名] | 新增/修改/废弃 | 向后兼容/不兼容 | [说明] |\n\n` +
    `## 2. 风险评估\n\n` +
    `### 2.1 技术风险\n\n` +
    `- [风险 1]：[缓解措施]\n` +
    `- [风险 2]：[缓解措施]\n\n` +
    `### 2.2 数据迁移\n\n` +
    `- [ ] 是否需要数据迁移：[是/否]\n` +
    `- 迁移方案：[说明]\n\n` +
    `## 3. 回滚方案\n\n` +
    `[描述回滚步骤]\n\n` +
    `## 4. 依赖方通知\n\n` +
    `| 依赖方 | 变更内容 | 通知状态 |\n` +
    `|--------|---------|--------|\n` +
    `| [团队/系统] | [变更描述] | 待通知/已通知 |\n`
  );
}

function detectProjectType(platforms: string[]): string {
  if (platforms.length === 0) return 'fullstack';
  if (platforms.every((p) => p.includes('frontend'))) return 'frontend';
  if (platforms.every((p) => p.includes('backend'))) return 'backend';
  return 'fullstack';
}

function buildConstitutionTemplateContext(opts: InitOptions, featureId: string): TemplateContext {
  return {
    featureId,
    title: opts.title,
    mode: opts.mode,
    size: opts.size,
    platforms: opts.platforms,
    projectType: detectProjectType(opts.platforms),
    timestamp: new Date().toISOString(),
    author: opts.author,
  };
}

function fallbackConstitution(featureId: string): string {
  return (
    `# Constitution — ${featureId}\n\n` +
    `> 项目宪法副本。请在 .spec-first/constitution.md 中维护主版本。\n\n` +
    `## Core Principles\n\n` +
    `1. 规范先行（Specification First）\n` +
    `2. 全链路追踪（Traceability）\n` +
    `3. 质量门禁（Quality Gates）\n\n`
  );
}

function skeletonConstitution(opts: InitOptions, featureId: string): string {
  const globalPath = join(opts.projectRoot, '.spec-first', 'constitution.md');
  if (exists(globalPath)) {
    return ensureConstitutionMeta(readMarkdown(globalPath));
  }

  const ctx = buildConstitutionTemplateContext(opts, featureId);
  try {
    return ensureConstitutionMeta(renderToString('init/constitution.md', ctx, opts.projectRoot));
  } catch {
    // 模板缺失/损坏时降级到内置骨架，避免 init 失败
    return ensureConstitutionMeta(fallbackConstitution(featureId));
  }
}

function ensureConstitutionMeta(content: string): string {
  const today = new Date().toISOString().slice(0, 10);
  let next = content.trimEnd();
  const dateOrDateTime =
    '\\d{4}-\\d{2}-\\d{2}(?:[T\\s]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?)?';

  const hasVersion = /(?:\*\*)?\s*(?:version|版本)\s*(?:\*\*)?\s*[:：]\s*[vV]?\d+\.\d+\.\d+/i.test(
    next
  );
  const hasRatified = new RegExp(
    `(?:\\*\\*)?\\s*(?:ratified|批准日期|通过日期|生效日期)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
    'i'
  ).test(next);
  const hasLastAmended = new RegExp(
    `(?:\\*\\*)?\\s*(?:last[_\\s-]*amended|最近修订|最后修订)\\s*(?:\\*\\*)?\\s*[:：]\\s*${dateOrDateTime}`,
    'i'
  ).test(next);
  const hasAmendmentHistory = /(?:^|\n)##\s*(amendment history|修订历史)\b/i.test(next);

  if (!hasVersion || !hasRatified || !hasLastAmended) {
    next += '\n\n## Meta\n';
    if (!hasVersion) next += '\n- Version: 1.0.0';
    if (!hasRatified) next += `\n- Ratified: ${today}`;
    if (!hasLastAmended) next += `\n- Last Amended: ${today}`;
  }

  if (!hasAmendmentHistory) {
    next +=
      '\n\n## Amendment History\n\n' +
      '| Version | Date | Summary |\n' +
      '|---------|------|---------|\n' +
      `| 1.0.0 | ${today} | Initial constitution |`;
  }

  return `${next.trimEnd()}\n`;
}

function writeCurrentFeature(projectRoot: string, featureId: string): void {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  ensureDir(join(projectRoot, '.spec-first'));
  writeMarkdown(currentPath, `${featureId}\n`);
}

function snapshotCurrentFeature(projectRoot: string): { existed: boolean; content?: string } {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentPath)) return { existed: false };
  return { existed: true, content: readMarkdown(currentPath) };
}

function restoreCurrentFeature(
  projectRoot: string,
  snapshot: { existed: boolean; content?: string }
): void {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  ensureDir(join(projectRoot, '.spec-first'));
  if (snapshot.existed) {
    writeMarkdown(currentPath, snapshot.content ?? '');
    return;
  }
  rmSync(currentPath, { force: true });
}

function ensureProjectConfig(projectRoot: string): void {
  const specFirstDir = join(projectRoot, '.spec-first');
  const metaDir = join(specFirstDir, 'meta');
  const configPath = join(metaDir, 'config.yaml');
  let wroteConfig = false;
  try {
    ensureDir(metaDir);
    if (!exists(configPath)) {
      writeMarkdown(configPath, renderDefaultConfigYaml());
      wroteConfig = true;
    }
  } catch {
    // 配置文件补齐属于非阻断副作用，失败时退回默认配置继续执行
    return;
  }
  if (wroteConfig) {
    resetConfigCache();
  }
}

interface FeatureInitTargets {
  specsDir: string;
  featureId: string;
  featureDir: string;
  tmpFeatureDir: string;
}

function resolveFeatureInitTargets(opts: InitOptions): FeatureInitTargets {
  const specsDir = join(opts.projectRoot, 'specs');
  const featureId = opts.featureId ?? generateFeatureId(opts.feat, specsDir);
  const featureDir = join(specsDir, featureId);
  const tmpFeatureDir = join(specsDir, `.${featureId}.tmp-${process.pid}-${Date.now()}`);
  return { specsDir, featureId, featureDir, tmpFeatureDir };
}

function assertFeatNotOccupied(
  existingId: string | undefined,
  feat: string,
  featureId: string
): void {
  if (existingId && existingId !== featureId) {
    throw new Error(`FEAT 缩写 "${feat}" 已被注册到 ${existingId}`);
  }
}

function recoverExistingFeature(
  opts: InitOptions,
  specsDir: string,
  featureId: string,
  featureDir: string,
  existingId: string | undefined,
  mergedRules: MergedRules
): InitResult {
  const backgroundInputStatus = detectBackgroundInputStatus(opts.projectRoot);
  if (!existingId) {
    registerFeat(specsDir, opts.feat, featureId);
  }
  writeCurrentFeature(opts.projectRoot, featureId);
  return {
    featureId,
    featureDir,
    mergedRules,
    backgroundInputStatus,
  };
}

function createInitialStageState(
  opts: InitOptions,
  featureId: string,
  mergedRules: MergedRules,
  backgroundInputStatus: BackgroundInputStatus
): StageState {
  const now = new Date().toISOString();
  return {
    featureId,
    mode: opts.mode,
    size: opts.size,
    platforms: opts.platforms,
    backgroundInputStatus,
    stageStatus: 'drafting',
    autoAdvancePolicy: 'suggest',
    mergedRules: {
      profile: mergedRules.profile ?? 'default-simplified',
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
}

/** Canonical marker for brownfield baseline captures — must match CLI constant. */
const LEGACY_BASELINE_FEATURE_ID = 'FSREQ-19700101-LEGACY-BASELINE';

function writeFeatureSkeleton(
  tmpFeatureDir: string,
  opts: InitOptions,
  featureId: string,
  mergedRules: MergedRules
): void {
  const backgroundInputStatus = detectBackgroundInputStatus(opts.projectRoot);
  ensureDir(tmpFeatureDir);
  ensureDir(join(tmpFeatureDir, 'reports'));
  ensureDir(join(tmpFeatureDir, 'contracts'));
  ensureDir(join(tmpFeatureDir, 'tests'));

  const state = createInitialStageState(opts, featureId, mergedRules, backgroundInputStatus);
  writeJson(join(tmpFeatureDir, 'stage-state.json'), state);
  writeMarkdown(join(tmpFeatureDir, 'findings.md'), skeletonFindings(featureId));
  writeMarkdown(join(tmpFeatureDir, 'traceability-matrix.md'), skeletonMatrix());
  writeMarkdown(join(tmpFeatureDir, 'constitution.md'), skeletonConstitution(opts, featureId));

  const isLegacyBaseline = featureId === LEGACY_BASELINE_FEATURE_ID;
  if (isLegacyBaseline) {
    // Baseline-specific skeletons: 已上线能力摘要 PRD + 基线补齐 task plan
    writeMarkdown(join(tmpFeatureDir, 'prd.md'), skeletonPrdBaseline(featureId, opts.title));
    writeMarkdown(join(tmpFeatureDir, 'task_plan.md'), skeletonTaskPlanBaseline(featureId, opts.title));
    // Baseline Features do not need impact-analysis.md
  } else {
    // Standard skeleton
    writeMarkdown(join(tmpFeatureDir, 'task_plan.md'), skeletonTaskPlan(featureId, opts.title));
    writeMarkdown(join(tmpFeatureDir, 'prd.md'), skeletonPrd(featureId, opts.title));
    // Mode I: scaffold impact analysis doc to guide change scope assessment
    if (opts.mode === 'I') {
      writeMarkdown(join(tmpFeatureDir, 'impact-analysis.md'), skeletonImpactAnalysis(featureId, opts.title));
    }
  }
}

function commitFeatureInit(
  opts: InitOptions,
  specsDir: string,
  featureId: string,
  featureDir: string,
  tmpFeatureDir: string
): 'created' | 'idempotent' {
  return withRegistryLock(specsDir, () => {
    const latest = loadRegistry(specsDir);
    const latestExistingId = latest.get(opts.feat);

    if (exists(featureDir)) {
      if (!latestExistingId) {
        registerFeatUnlocked(specsDir, opts.feat, featureId);
      }
      writeCurrentFeature(opts.projectRoot, featureId);
      return 'idempotent';
    }

    if (latestExistingId && latestExistingId !== featureId) {
      throw new Error(`FEAT 缩写 "${opts.feat}" 已被注册到 ${latestExistingId}`);
    }

    const currentSnapshot = snapshotCurrentFeature(opts.projectRoot);
    let renamed = false;
    try {
      renameSync(tmpFeatureDir, featureDir);
      renamed = true;
      writeCurrentFeature(opts.projectRoot, featureId);
      if (!latestExistingId) {
        registerFeatUnlocked(specsDir, opts.feat, featureId);
      }
      return 'created';
    } catch (error) {
      if (renamed) {
        rmSync(featureDir, { recursive: true, force: true });
      }
      restoreCurrentFeature(opts.projectRoot, currentSnapshot);
      throw error;
    }
  });
}

function recoverFromInitError(
  error: unknown,
  opts: InitOptions,
  specsDir: string,
  featureId: string,
  featureDir: string,
  tmpFeatureDir: string,
  mergedRules: MergedRules
): InitResult {
  rmSync(tmpFeatureDir, { recursive: true, force: true });
  if (!exists(featureDir)) {
    throw error;
  }
  return recoverExistingFeature(
    opts,
    specsDir,
    featureId,
    featureDir,
    loadRegistry(specsDir).get(opts.feat),
    mergedRules
  );
}

// ─── 主逻辑 ──────────────────────────────────────────────

/**
 * Feature 初始化
 * 幂等：已存在的 Feature 不覆盖，直接返回
 */
export function init(opts: InitOptions): InitResult {
  validateFeat(opts.feat);

  const targets = resolveFeatureInitTargets(opts);
  ensureDir(targets.specsDir);
  ensureProjectConfig(opts.projectRoot);

  const existingId = loadRegistry(targets.specsDir).get(opts.feat);
  const mergedRules = mergeLayerRules(opts.mode, opts.size, opts.platforms, opts.projectRoot);
  const backgroundInputStatus = detectBackgroundInputStatus(opts.projectRoot);

  if (exists(targets.featureDir)) {
    return recoverExistingFeature(
      opts,
      targets.specsDir,
      targets.featureId,
      targets.featureDir,
      existingId,
      mergedRules
    );
  }

  assertFeatNotOccupied(existingId, opts.feat, targets.featureId);

  try {
    writeFeatureSkeleton(targets.tmpFeatureDir, opts, targets.featureId, mergedRules);
    const commitResult = commitFeatureInit(
      opts,
      targets.specsDir,
      targets.featureId,
      targets.featureDir,
      targets.tmpFeatureDir
    );
    if (commitResult === 'idempotent') {
      rmSync(targets.tmpFeatureDir, { recursive: true, force: true });
    }
  } catch (error) {
    return recoverFromInitError(
      error,
      opts,
      targets.specsDir,
      targets.featureId,
      targets.featureDir,
      targets.tmpFeatureDir,
      mergedRules
    );
  }

  return {
    featureId: targets.featureId,
    featureDir: targets.featureDir,
    mergedRules,
    backgroundInputStatus,
  };
}
