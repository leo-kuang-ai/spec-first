/**
 * Feature 初始化
 * 生成 Feature ID → 创建目录 → 渲染状态 → 初始化骨架文件 → 注册缩写
 */
import { join } from 'node:path';
import { closeSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { Stage } from '../../shared/types.js';
import type { Mode, Size, StageState } from '../../shared/types.js';
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
    const header =
      '# FEAT 缩写注册表\n\n'
      + '| FEAT | Feature ID |\n'
      + '|------|------------|\n';
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
      'utf-8',
    );
  } catch {
    // ignore payload write failure; lock ownership is still valid
  }
}

function tryRecoverStaleRegistryLock(lockPath: string): boolean {
  const payload = readRegistryLockPayload(lockPath);
  const createdAt = payload?.createdAt ?? readRegistryLockMtime(lockPath);
  const staleByAge = createdAt > 0 && Date.now() - createdAt >= REGISTRY_LOCK_STALE_MS;
  const staleByPid = typeof payload?.pid === 'number' && payload.pid > 0 && !isProcessAlive(payload.pid);

  if (!staleByAge && !staleByPid) return false;

  try {
    unlinkSync(lockPath);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    return err.code === 'ENOENT';
  }
}

function readRegistryLockPayload(lockPath: string): { pid?: number; createdAt?: number } | undefined {
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
  return `# Findings — ${featureId}\n\n`
    + `## 过程发现\n\n`
    + `> 记录 Gate 校验、Force 跳过、Pilot 降级等过程事件。\n\n`
    + `| 时间 | 阶段 | 类型 | 描述 |\n`
    + `|------|------|------|------|\n`;
}

function skeletonTaskPlan(featureId: string, title: string): string {
  return `# Task Plan — ${featureId}\n\n`
    + `> ${title}\n\n`
    + `## Phase 1: Setup（基础设置）\n\n`
    + `- [ ] TASK-XXX-001 [P] [US1] 初始化基础骨架\n\n`
    + `## Phase 2: User Stories - P1（核心价值）\n\n`
    + `### US1 — Core Flow (P1)\n\n`
    + `- [ ] TASK-XXX-002 [P] [US1] 实现核心接口\n`
    + `- [ ] TASK-XXX-003 [US1] 完成核心交互与验证\n\n`
    + `## 任务明细\n\n`
    + `| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |\n`
    + `|---|---|---|---|---|---|---|---|\n`;
}

function skeletonMatrix(): string {
  return '| ID | Type | Title | Status | Upstream | Downstream |\n'
    + '|----|------|-------|--------|----------|------------|\n';
}

function skeletonConstitution(featureId: string, projectRoot: string): string {
  const globalPath = join(projectRoot, '.spec-first', 'constitution.md');
  if (exists(globalPath)) {
    return ensureConstitutionMeta(readMarkdown(globalPath));
  }
  return ensureConstitutionMeta(
    `# Constitution — ${featureId}\n\n`
    + `> 项目宪法副本。请在 .spec-first/constitution.md 中维护主版本。\n\n`
    + `## Core Principles\n\n`
    + `1. 规范先行（Specification First）\n`
    + `2. 全链路追踪（Traceability）\n`
    + `3. 质量门禁（Quality Gates）\n\n`,
  );
}

function ensureConstitutionMeta(content: string): string {
  const today = new Date().toISOString().slice(0, 10);
  let next = content.trimEnd();

  const hasVersion = /(?:\*\*)?\s*(?:version|版本)\s*(?:\*\*)?\s*[:：]\s*[vV]?\d+\.\d+\.\d+/i.test(next);
  const hasRatified = /(?:\*\*)?\s*(?:ratified|批准日期|通过日期|生效日期)\s*(?:\*\*)?\s*[:：]\s*\d{4}-\d{2}-\d{2}/i.test(next);
  const hasLastAmended = /(?:\*\*)?\s*(?:last[_\s-]*amended|最近修订|最后修订)\s*(?:\*\*)?\s*[:：]\s*\d{4}-\d{2}-\d{2}/i.test(next);
  const hasAmendmentHistory = /(?:^|\n)##\s*(amendment history|修订历史)\b/i.test(next);

  if (!hasVersion || !hasRatified || !hasLastAmended) {
    next += '\n\n## Meta\n';
    if (!hasVersion) next += '\n- Version: 1.0.0';
    if (!hasRatified) next += `\n- Ratified: ${today}`;
    if (!hasLastAmended) next += `\n- Last Amended: ${today}`;
  }

  if (!hasAmendmentHistory) {
    next += '\n\n## Amendment History\n\n'
      + '| Version | Date | Summary |\n'
      + '|---------|------|---------|\n'
      + `| 1.0.0 | ${today} | Initial constitution |`;
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

function restoreCurrentFeature(projectRoot: string, snapshot: { existed: boolean; content?: string }): void {
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

function assertFeatNotOccupied(existingId: string | undefined, feat: string, featureId: string): void {
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
  mergedRules: MergedRules,
): InitResult {
  if (!existingId) {
    registerFeat(specsDir, opts.feat, featureId);
  }
  writeCurrentFeature(opts.projectRoot, featureId);
  return { featureId, featureDir, mergedRules };
}

function createInitialStageState(
  opts: InitOptions,
  featureId: string,
  mergedRules: MergedRules,
): StageState {
  const now = new Date().toISOString();
  return {
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
}

function writeFeatureSkeleton(
  tmpFeatureDir: string,
  opts: InitOptions,
  featureId: string,
  mergedRules: MergedRules,
): void {
  ensureDir(tmpFeatureDir);
  ensureDir(join(tmpFeatureDir, 'reports'));
  ensureDir(join(tmpFeatureDir, 'contracts'));
  ensureDir(join(tmpFeatureDir, 'tests'));

  const state = createInitialStageState(opts, featureId, mergedRules);
  writeJson(join(tmpFeatureDir, 'stage-state.json'), state);
  writeMarkdown(join(tmpFeatureDir, 'findings.md'), skeletonFindings(featureId));
  writeMarkdown(join(tmpFeatureDir, 'task_plan.md'), skeletonTaskPlan(featureId, opts.title));
  writeMarkdown(join(tmpFeatureDir, 'traceability-matrix.md'), skeletonMatrix());
  writeMarkdown(join(tmpFeatureDir, 'constitution.md'), skeletonConstitution(featureId, opts.projectRoot));
}

function commitFeatureInit(
  opts: InitOptions,
  specsDir: string,
  featureId: string,
  featureDir: string,
  tmpFeatureDir: string,
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
  mergedRules: MergedRules,
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
    mergedRules,
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

  if (exists(targets.featureDir)) {
    return recoverExistingFeature(
      opts,
      targets.specsDir,
      targets.featureId,
      targets.featureDir,
      existingId,
      mergedRules,
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
      targets.tmpFeatureDir,
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
      mergedRules,
    );
  }

  return {
    featureId: targets.featureId,
    featureDir: targets.featureDir,
    mergedRules,
  };
}
