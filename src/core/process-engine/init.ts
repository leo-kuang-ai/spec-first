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
        closeSync(lockFd);
        try {
          unlinkSync(lockPath);
        } catch {
          // ignore unlock cleanup failure
        }
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') throw error;
      if (tryRecoverStaleRegistryLock(lockPath)) continue;

      if (Date.now() - start >= REGISTRY_LOCK_TIMEOUT_MS) {
        throw new Error(`获取 FEAT 注册表锁超时：${lockPath}`);
      }
      sleepMs(REGISTRY_LOCK_RETRY_MS);
    }
  }
}

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
    // 幂等自愈：修复 current 指针与 FEAT 注册表缺失
    if (!existingId) {
      registerFeat(specsDir, opts.feat, featureId);
    }
    writeCurrentFeature(opts.projectRoot, featureId);
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

  const tmpFeatureDir = join(specsDir, `.${featureId}.tmp-${process.pid}-${Date.now()}`);
  try {
    // 阶段一：创建临时目录并写入全部产物
    ensureDir(tmpFeatureDir);
    ensureDir(join(tmpFeatureDir, 'reports'));
    ensureDir(join(tmpFeatureDir, 'contracts'));
    ensureDir(join(tmpFeatureDir, 'tests'));

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
    writeJson(join(tmpFeatureDir, 'stage-state.json'), state);

    // 运行态三文件
    writeMarkdown(join(tmpFeatureDir, 'progress.md'), skeletonProgress(featureId, opts.title, opts.author));
    writeMarkdown(join(tmpFeatureDir, 'findings.md'), skeletonFindings(featureId));
    writeMarkdown(join(tmpFeatureDir, 'task_plan.md'), skeletonTaskPlan(featureId, opts.title));

    // traceability-matrix.md
    writeMarkdown(join(tmpFeatureDir, 'traceability-matrix.md'), skeletonMatrix());

    // constitution.md 副本
    writeMarkdown(join(tmpFeatureDir, 'constitution.md'), skeletonConstitution(featureId, opts.projectRoot));

    // 阶段二：在短临界区内做提交（唯一性校验/原子落盘/注册/current）
    const commitResult = withRegistryLock(specsDir, () => {
      const latest = loadRegistry(specsDir);
      const latestExistingId = latest.get(opts.feat);

      if (exists(featureDir)) {
        if (!latestExistingId) {
          registerFeatUnlocked(specsDir, opts.feat, featureId);
        }
        writeCurrentFeature(opts.projectRoot, featureId);
        return 'idempotent' as const;
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
        return 'created' as const;
      } catch (error) {
        if (renamed) {
          rmSync(featureDir, { recursive: true, force: true });
        }
        restoreCurrentFeature(opts.projectRoot, currentSnapshot);
        throw error;
      }
    });

    if (commitResult === 'idempotent') {
      rmSync(tmpFeatureDir, { recursive: true, force: true });
    }
  } catch (error) {
    rmSync(tmpFeatureDir, { recursive: true, force: true });
    if (exists(featureDir)) {
      // 并发场景：其他进程已完成初始化，走幂等自愈返回
      if (!loadRegistry(specsDir).get(opts.feat)) {
        registerFeat(specsDir, opts.feat, featureId);
      }
      writeCurrentFeature(opts.projectRoot, featureId);
      return { featureId, featureDir, mergedRules };
    }
    throw error;
  }

  return { featureId, featureDir, mergedRules };
}
