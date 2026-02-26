/**
 * config.yaml Schema 定义与校验
 * 统一各模块配置项命名和类型
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { exists } from './fs-utils.js';

export interface SpecFirstConfig {
  catchup: { trigger: 'auto' | 'prompt' | 'off' };
  context: { token_budget: number };
  runtime: { max_iterations: number; max_self_corrections: number; kv_cache_hard_gate: boolean };
  gate: { pilot_mode: boolean };
  health: {
    weights: {
      w1: number; w2: number; w3: number;
      w4: number; w5: number; w6: number;
      w7: number; w8: number; w9: number;
    };
  };
}

export const DEFAULT_SPEC_FIRST_CONFIG: SpecFirstConfig = {
  catchup: { trigger: 'prompt' },
  context: { token_budget: 16000 },
  runtime: { max_iterations: 5, max_self_corrections: 3, kv_cache_hard_gate: false },
  gate: { pilot_mode: false },
  health: {
    weights: {
      w1: 0.10, w2: 0.10, w3: 0.10,
      w4: 0.15, w5: 0.10, w6: 0.15,
      w7: 0.10, w8: 0.10, w9: 0.10,
    },
  },
};

let cachedConfig: SpecFirstConfig | null = null;

export function renderDefaultConfigYaml(): string {
  return yaml.dump(DEFAULT_SPEC_FIRST_CONFIG, { noRefs: true });
}

/** 加载并校验 config.yaml，返回合并后的配置 */
export function loadConfig(projectRoot: string): SpecFirstConfig {
  if (cachedConfig) return cachedConfig;

  const configPath = join(projectRoot, '.spec-first', 'config.yaml');
  if (!exists(configPath)) {
    cachedConfig = structuredClone(DEFAULT_SPEC_FIRST_CONFIG);
    return cachedConfig;
  }

  const raw = readFileSync(configPath, 'utf-8');
  const parsed = yaml.load(raw) as Record<string, unknown> | null;

  if (!parsed || typeof parsed !== 'object') {
    cachedConfig = structuredClone(DEFAULT_SPEC_FIRST_CONFIG);
    return cachedConfig;
  }

  cachedConfig = mergeWithDefaults(parsed);
  validate(cachedConfig);
  return cachedConfig;
}

/** 类型安全的配置读取 */
export function getConfigValue<K extends keyof SpecFirstConfig>(
  config: SpecFirstConfig,
  key: K,
): SpecFirstConfig[K] {
  return config[key];
}

/** 重置缓存（测试用） */
export function resetConfigCache(): void {
  cachedConfig = null;
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
    errors.push(`runtime.max_self_corrections must be 1-10, got ${cfg.runtime.max_self_corrections}`);
  }

  const wSum = Object.values(cfg.health.weights).reduce((a, b) => a + b, 0);
  if (Math.abs(wSum - 1.0) > 0.01) {
    errors.push(`health.weights must sum to 1.0, got ${wSum.toFixed(3)}`);
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }
}
