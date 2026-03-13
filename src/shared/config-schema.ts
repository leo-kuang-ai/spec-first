/**
 * config.yaml Schema 定义与校验
 * 统一各模块配置项命名和类型
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import { RELEASE_REQUIRED_ARTIFACTS } from '../core/rules/truth-source.js';
import { exists } from './fs-utils.js';

export interface AutoOrchestrateConfig {
  enabled: boolean;
  stop_on_blocked: boolean;
  max_task_duration_ms: number;
  heartbeat_timeout_ms: number;
  watchdog_interval_ms: number;
  max_retry_per_task: number;
  retry_backoff_ms: number;
  max_total_retry_duration_ms: number;
  max_parallel: number;
}

export type AuditTamperProof = 'none' | 'hash_chain';

/** 阶段依赖配置 */
export interface StageDependencyConfig {
  npmScripts?: string[];
  files?: string[];
  envVars?: string[];
}

export interface DependenciesConfig {
  /** 各阶段的依赖检查配置，key 为阶段名（如 '02_design', '03_plan） */
  stages?: Record<string, StageDependencyConfig>;
  /** 是否在 stage advance 时自动检查依赖 */
  autoCheck?: boolean;
}

export interface AuditLogConfig {
  enabled: boolean;
  tamper_proof: AuditTamperProof;
  rotation_size_mb: number;
}

export interface SpecFirstConfig {
  catchup: { trigger: 'auto' | 'prompt' | 'off' };
  context: { token_budget: number };
  runtime: {
    max_iterations: number;
    max_self_corrections: number;
    kv_cache_hard_gate: boolean;
    auto_orchestrate: AutoOrchestrateConfig;
    audit_log: AuditLogConfig;
  };
  gate: {
    pilot_mode: boolean;
    profile: 'default-simplified' | 'strict';
  };
  health: {
    weights: {
      w1: number;
      w2: number;
      w3: number;
      w4: number;
      w5: number;
      w6: number;
      w7: number;
      w8: number;
      w9: number;
    };
  };
  dependencies?: DependenciesConfig;
}

export const DEFAULT_SPEC_FIRST_CONFIG: SpecFirstConfig = {
  catchup: { trigger: 'prompt' },
  context: { token_budget: 16000 },
  runtime: {
    max_iterations: 5,
    max_self_corrections: 3,
    kv_cache_hard_gate: false,
    auto_orchestrate: {
      enabled: false,
      stop_on_blocked: true,
      max_task_duration_ms: 600_000,
      heartbeat_timeout_ms: 300_000,
      watchdog_interval_ms: 10_000,
      max_retry_per_task: 3,
      retry_backoff_ms: 2_000,
      max_total_retry_duration_ms: 900_000,
      max_parallel: 1,
    },
    audit_log: {
      enabled: true,
      tamper_proof: 'hash_chain',
      rotation_size_mb: 10,
    },
  },
  gate: { pilot_mode: false, profile: 'default-simplified' },
  dependencies: {
    autoCheck: true,
    stages: {
      '02_design': {
        files: ['specs/{featureId}/prd.md', 'specs/{featureId}/spec.md'],
      },
      '03_plan': {
        files: ['specs/{featureId}/design.md'],
      },
      '04_implement': {
        npmScripts: ['test', 'build'],
      },
      '05_verify': {
        npmScripts: ['test'],
      },
      '06_wrap_up': {
        files: ['specs/{featureId}/retro.md'],
      },
      '07_release': {
        files: RELEASE_REQUIRED_ARTIFACTS.map((item) => `specs/{featureId}/${item}`),
        npmScripts: ['contract:check'],
      },
    },
  },
  health: {
    weights: {
      w1: 0.1,
      w2: 0.1,
      w3: 0.1,
      w4: 0.15,
      w5: 0.1,
      w6: 0.15,
      w7: 0.1,
      w8: 0.1,
      w9: 0.1,
    },
  },
};

// 按 projectRoot 缓存的配置 Map，避免多项目场景下配置串用
interface CacheEntry {
  config: SpecFirstConfig;
  cachedAt: number;
}
const CONFIG_CACHE_TTL_MS = 30_000; // 30 秒过期
const configCache = new Map<string, CacheEntry>();

export function renderDefaultConfigYaml(): string {
  return yaml.dump(DEFAULT_SPEC_FIRST_CONFIG, { noRefs: true });
}

/**
 * 深度合并两个对象（source 覆盖 target 的同名属性）
 * 用于 meta → local → config.yaml 的配置合并
 */
function deepMerge(target: Record<string, unknown>, source: unknown): Record<string, unknown> {
  if (!source || typeof source !== 'object') return target;
  if (Array.isArray(source)) return target; // 不合并数组，保持原样

  const result = structuredClone(target);
  const src = source as Record<string, unknown>;

  for (const key of Object.keys(src)) {
    const srcValue = src[key];
    const targetValue = result[key];

    if (srcValue === undefined) continue;

    if (
      srcValue &&
      typeof srcValue === 'object' &&
      !Array.isArray(srcValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // 递归合并嵌套对象
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        srcValue as Record<string, unknown>
      );
    } else {
      // 直接覆盖（包括数组）
      result[key] = srcValue;
    }
  }

  return result;
}

/**
 * 加载并校验 config.yaml，返回合并后的配置
 * 合并顺序：DEFAULT → meta/config.yaml → local/config.yaml
 */
export function loadConfig(projectRoot: string): SpecFirstConfig {
  // 规范化路径，避免 /a/b 和 /a/b/ 被视为不同 key
  const normalizedRoot = resolve(projectRoot);

  const cached = configCache.get(normalizedRoot);
  if (cached && Date.now() - cached.cachedAt < CONFIG_CACHE_TTL_MS) return cached.config;

  // 从两个层级加载配置，local 覆盖 meta，meta 覆盖默认
  const metaPath = join(projectRoot, '.spec-first', 'meta', 'config.yaml');
  const localPath = join(projectRoot, '.spec-first', 'local', 'config.yaml');

  let merged: Record<string, unknown> = structuredClone(
    DEFAULT_SPEC_FIRST_CONFIG
  ) as unknown as Record<string, unknown>;

  // Layer 1: meta/config.yaml（包级基线）
  if (exists(metaPath)) {
    const raw = readFileSync(metaPath, 'utf-8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    if (parsed && typeof parsed === 'object') {
      merged = deepMerge(merged, parsed);
    }
  }

  // Layer 2: local/config.yaml（用户定制）
  if (exists(localPath)) {
    const raw = readFileSync(localPath, 'utf-8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    if (parsed && typeof parsed === 'object') {
      merged = deepMerge(merged, parsed);
    }
  }

  // 使用现有的 mergeWithDefaults 进行类型安全的合并（确保所有必需字段存在）
  const result = mergeWithDefaults(merged);
  validate(result);
  configCache.set(normalizedRoot, { config: result, cachedAt: Date.now() });
  return result;
}

/** 类型安全的配置读取 */
export function getConfigValue<K extends keyof SpecFirstConfig>(
  config: SpecFirstConfig,
  key: K
): SpecFirstConfig[K] {
  return config[key];
}

/** 重置缓存
 * @param projectRoot - 指定项目路径时仅删除该项目的缓存，否则清空全部
 */
export function resetConfigCache(projectRoot?: string): void {
  if (projectRoot) {
    const normalizedRoot = resolve(projectRoot);
    configCache.delete(normalizedRoot);
  } else {
    configCache.clear();
  }
}

function mergeWithDefaults(parsed: Record<string, unknown>): SpecFirstConfig {
  const cfg = structuredClone(DEFAULT_SPEC_FIRST_CONFIG);

  // catchup.trigger
  const catchup = parsed.catchup as Record<string, unknown> | undefined;
  if (catchup?.trigger && ['auto', 'prompt', 'off'].includes(String(catchup.trigger))) {
    cfg.catchup.trigger = catchup.trigger as SpecFirstConfig['catchup']['trigger'];
  }

  // context.token_budget
  const context = parsed.context as Record<string, unknown> | undefined;
  if (context?.token_budget && typeof context.token_budget === 'number') {
    cfg.context.token_budget = context.token_budget;
  }

  // gate.pilot_mode
  const gate = parsed.gate as Record<string, unknown> | undefined;
  if (gate && typeof gate.pilot_mode === 'boolean') {
    cfg.gate.pilot_mode = gate.pilot_mode;
  }
  if (gate?.profile && ['default-simplified', 'strict'].includes(String(gate.profile))) {
    cfg.gate.profile = gate.profile as SpecFirstConfig['gate']['profile'];
  }

  // runtime.max_iterations
  const runtime = parsed.runtime as Record<string, unknown> | undefined;
  if (typeof runtime?.max_iterations === 'number') {
    cfg.runtime.max_iterations = runtime.max_iterations;
  }
  if (typeof runtime?.max_self_corrections === 'number') {
    cfg.runtime.max_self_corrections = runtime.max_self_corrections;
  }
  if (typeof runtime?.kv_cache_hard_gate === 'boolean') {
    cfg.runtime.kv_cache_hard_gate = runtime.kv_cache_hard_gate;
  }

  // runtime.auto_orchestrate
  const ao = runtime?.auto_orchestrate as Record<string, unknown> | undefined;
  if (ao) {
    if (typeof ao.enabled === 'boolean') cfg.runtime.auto_orchestrate.enabled = ao.enabled;
    if (typeof ao.stop_on_blocked === 'boolean')
      cfg.runtime.auto_orchestrate.stop_on_blocked = ao.stop_on_blocked;
    if (typeof ao.max_task_duration_ms === 'number')
      cfg.runtime.auto_orchestrate.max_task_duration_ms = ao.max_task_duration_ms;
    if (typeof ao.heartbeat_timeout_ms === 'number')
      cfg.runtime.auto_orchestrate.heartbeat_timeout_ms = ao.heartbeat_timeout_ms;
    if (typeof ao.watchdog_interval_ms === 'number')
      cfg.runtime.auto_orchestrate.watchdog_interval_ms = ao.watchdog_interval_ms;
    if (typeof ao.max_retry_per_task === 'number')
      cfg.runtime.auto_orchestrate.max_retry_per_task = ao.max_retry_per_task;
    if (typeof ao.retry_backoff_ms === 'number')
      cfg.runtime.auto_orchestrate.retry_backoff_ms = ao.retry_backoff_ms;
    if (typeof ao.max_total_retry_duration_ms === 'number')
      cfg.runtime.auto_orchestrate.max_total_retry_duration_ms = ao.max_total_retry_duration_ms;
    if (typeof ao.max_parallel === 'number')
      cfg.runtime.auto_orchestrate.max_parallel = ao.max_parallel;
  }

  // runtime.audit_log
  const al = runtime?.audit_log as Record<string, unknown> | undefined;
  if (al) {
    if (typeof al.enabled === 'boolean') cfg.runtime.audit_log.enabled = al.enabled;
    if (typeof al.tamper_proof === 'string' && ['none', 'hash_chain'].includes(al.tamper_proof)) {
      cfg.runtime.audit_log.tamper_proof = al.tamper_proof as AuditTamperProof;
    }
    if (typeof al.rotation_size_mb === 'number')
      cfg.runtime.audit_log.rotation_size_mb = al.rotation_size_mb;
  }

  // health.weights
  const health = parsed.health as Record<string, unknown> | undefined;
  const weights = health?.weights as Record<string, number> | undefined;
  if (weights) {
    for (const k of Object.keys(cfg.health.weights) as Array<keyof typeof cfg.health.weights>) {
      if (typeof weights[k] === 'number') {
        cfg.health.weights[k] = weights[k];
      }
    }
  }

  return cfg;
}

function validate(cfg: SpecFirstConfig): void {
  const errors: string[] = [];

  if (cfg.context.token_budget < 8000 || cfg.context.token_budget > 64000) {
    errors.push(`context.token_budget must be 8000-64000, got ${cfg.context.token_budget}`);
  }

  if (cfg.runtime.max_iterations < 1 || cfg.runtime.max_iterations > 20) {
    errors.push(`runtime.max_iterations must be 1-20, got ${cfg.runtime.max_iterations}`);
  }
  if (cfg.runtime.max_self_corrections < 1 || cfg.runtime.max_self_corrections > 10) {
    errors.push(
      `runtime.max_self_corrections must be 1-10, got ${cfg.runtime.max_self_corrections}`
    );
  }

  // auto_orchestrate 范围校验
  const ao = cfg.runtime.auto_orchestrate;
  if (ao.max_task_duration_ms < 60_000 || ao.max_task_duration_ms > 3_600_000) {
    errors.push(
      `auto_orchestrate.max_task_duration_ms must be 60000-3600000, got ${ao.max_task_duration_ms}`
    );
  }
  if (ao.heartbeat_timeout_ms < 10_000 || ao.heartbeat_timeout_ms > 600_000) {
    errors.push(
      `auto_orchestrate.heartbeat_timeout_ms must be 10000-600000, got ${ao.heartbeat_timeout_ms}`
    );
  }
  if (ao.watchdog_interval_ms < 1_000 || ao.watchdog_interval_ms > 60_000) {
    errors.push(
      `auto_orchestrate.watchdog_interval_ms must be 1000-60000, got ${ao.watchdog_interval_ms}`
    );
  }
  if (ao.max_retry_per_task < 0 || ao.max_retry_per_task > 10) {
    errors.push(`auto_orchestrate.max_retry_per_task must be 0-10, got ${ao.max_retry_per_task}`);
  }
  if (ao.retry_backoff_ms < 100 || ao.retry_backoff_ms > 30_000) {
    errors.push(`auto_orchestrate.retry_backoff_ms must be 100-30000, got ${ao.retry_backoff_ms}`);
  }
  if (ao.max_total_retry_duration_ms < 60_000 || ao.max_total_retry_duration_ms > 7_200_000) {
    errors.push(
      `auto_orchestrate.max_total_retry_duration_ms must be 60000-7200000, got ${ao.max_total_retry_duration_ms}`
    );
  }
  if (ao.max_parallel < 1 || ao.max_parallel > 4) {
    errors.push(`auto_orchestrate.max_parallel must be 1-4, got ${ao.max_parallel}`);
  }

  // audit_log 范围校验
  const al = cfg.runtime.audit_log;
  if (al.rotation_size_mb < 1 || al.rotation_size_mb > 100) {
    errors.push(`audit_log.rotation_size_mb must be 1-100, got ${al.rotation_size_mb}`);
  }

  const wSum = Object.values(cfg.health.weights).reduce((a, b) => a + b, 0);
  if (Math.abs(wSum - 1.0) > 0.01) {
    errors.push(`health.weights must sum to 1.0, got ${wSum.toFixed(3)}`);
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
}
