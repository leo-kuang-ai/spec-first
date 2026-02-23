/**
 * 三层合并逻辑
 * Layer 0 基线 → Layer 1 Mode×Size 裁剪 → Layer 2 平台 YAML 合并
 */
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import type { Mode, Size, Stage } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';

// ─── 合并结果类型 ─────────────────────────────────────────

export interface GateCondition {
  id: string;
  description: string;
  type?: 'auto' | 'manual';
  command?: string;
  threshold?: number;
}

export interface Deliverable {
  name: string;
  required: boolean;
  description?: string;
}

export interface ThresholdEntry {
  value: number;
  direction: 'higher_is_better' | 'lower_is_better';
}

export interface MergedRules {
  mode: Mode;
  size: Size;
  platforms: string[];
  gateConditions: Record<string, GateCondition[]>;
  deliverables: Record<string, Deliverable[]>;
  thresholds: Record<string, ThresholdEntry>;
}

// ─── Layer 0 基线 ─────────────────────────────────────────

/** 基线 Gate 条件（各阶段通用最低要求） */
function layer0Gates(): Record<string, GateCondition[]> {
  return {
    '01_specify': [
      { id: 'L0-SPEC-001', description: 'FR/NFR 列表存在且非空' },
    ],
    '02_design': [
      { id: 'L0-DESIGN-001', description: '设计文档存在' },
    ],
    '03_plan': [
      { id: 'L0-PLAN-001', description: 'task_plan.md 存在且非空' },
    ],
    '04_implement': [
      { id: 'L0-IMPL-001', description: '追踪矩阵覆盖率 ≥ 基线' },
    ],
    '05_verify': [
      { id: 'L0-VERIFY-001', description: '测试用例存在且通过' },
    ],
    '06_wrap_up': [
      { id: 'L0-WRAP-001', description: '归档清单完整' },
    ],
  };
}

/** 基线产出物（各阶段标准交付物） */
function layer0Deliverables(): Record<string, Deliverable[]> {
  return {
    '01_specify': [
      { name: 'spec.md', required: true, description: 'FR/NFR 列表' },
    ],
    '02_design': [
      { name: 'design.md', required: true, description: '技术设计文档' },
      { name: 'api-contract.yaml', required: true, description: 'API 契约' },
    ],
    '03_plan': [
      { name: 'task_plan.md', required: true, description: '任务计划' },
    ],
    '05_verify': [
      { name: 'reports/test-report.md', required: true, description: '测试报告' },
    ],
    '06_wrap_up': [
      { name: 'traceability-matrix.md', required: true, description: '追踪矩阵' },
    ],
  };
}

// ─── Layer 1 Mode×Size 裁剪 ──────────────────────────────

function applyLayer1(
  gates: Record<string, GateCondition[]>,
  deliverables: Record<string, Deliverable[]>,
  mode: Mode,
  size: Size,
): void {
  // Mode I 追加
  if (mode === 'I') {
    gates['01_specify'] = gates['01_specify'] ?? [];
    gates['01_specify'].push({
      id: 'L1-MODE-I-001',
      description: 'impact-analysis.md 存在且非空',
    });
    deliverables['01_specify'] = deliverables['01_specify'] ?? [];
    deliverables['01_specify'].push({
      name: 'impact-analysis.md', required: true, description: '变更影响分析',
    });
    deliverables['05_verify'] = deliverables['05_verify'] ?? [];
    deliverables['05_verify'].push({
      name: 'reports/regression-report.md', required: true, description: '回归验证报告',
    });
  }

  // Size M/L 追加产出物
  if (size === 'M' || size === 'L') {
    deliverables['01_specify'] = deliverables['01_specify'] ?? [];
    deliverables['01_specify'].push({
      name: 'user-stories.md', required: false, description: '用户故事',
    });
    deliverables['02_design'] = deliverables['02_design'] ?? [];
    deliverables['02_design'].push({
      name: 'data-model.md', required: false, description: '数据模型',
    });
  }
  if (size === 'L') {
    deliverables['02_design'] = deliverables['02_design'] ?? [];
    deliverables['02_design'].push({
      name: 'adr/', required: false, description: '架构决策记录',
    });
    deliverables['03_plan'] = deliverables['03_plan'] ?? [];
    deliverables['03_plan'].push({
      name: 'risk-matrix.md', required: false, description: '风险矩阵',
    });
    deliverables['05_verify'] = deliverables['05_verify'] ?? [];
    deliverables['05_verify'].push(
      { name: 'reports/perf-report.md', required: false, description: '性能测试报告' },
      { name: 'reports/security-scan.md', required: false, description: '安全扫描报告' },
    );
  }
}

// ─── Layer 2 平台 YAML 合并 ──────────────────────────────

interface PlatformYaml {
  platform: string;
  gate_conditions?: Record<string, GateCondition[]>;
  extra_deliverables?: Record<string, unknown[]>;
  quality_thresholds?: Record<string, unknown>;
}

const THRESHOLD_DIRECTIONS: ThresholdEntry['direction'][] = ['higher_is_better', 'lower_is_better'];

function asObject(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error('平台 YAML 必须是对象');
  }
  return v as Record<string, unknown>;
}

function loadPlatformYaml(platform: string, projectRoot: string): PlatformYaml {
  const p = join(projectRoot, '.spec-first', 'layer2', `${platform}.yaml`);
  if (!exists(p)) {
    throw new Error(`未找到平台 YAML：${p}`);
  }
  const raw = readFileSync(p, 'utf-8');
  const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
  const root = asObject(parsed);
  if (typeof root.platform !== 'string' || root.platform.trim() === '') {
    throw new Error(`无效平台 YAML（${platform}）："platform" 为必填`);
  }
  return root as unknown as PlatformYaml;
}

/** direction 推断：缺失时按命名规则推断，无法推断返回 undefined */
function inferDirection(key: string): 'higher_is_better' | 'lower_is_better' | undefined {
  const lower = key.toLowerCase();
  if (/max|size|latency|time|error|violation|anr|bug/.test(lower)) return 'lower_is_better';
  if (/coverage|score|rate|pass|availability/.test(lower)) return 'higher_is_better';
  return undefined;
}

function normalizeDeliverable(raw: unknown, stage: string, platform: string): Deliverable {
  if (typeof raw === 'string' && raw.trim() !== '') {
    return { name: raw.trim(), required: false };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`平台 "${platform}" 的阶段 "${stage}" 存在无效 deliverable`);
  }
  const entry = raw as Record<string, unknown>;
  if (typeof entry.name !== 'string' || entry.name.trim() === '') {
    throw new Error(`平台 "${platform}" 的阶段 "${stage}" 缺少 deliverable 名称`);
  }
  return {
    name: entry.name.trim(),
    required: typeof entry.required === 'boolean' ? entry.required : false,
    description: typeof entry.description === 'string' ? entry.description : undefined,
  };
}

function parseThresholdNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  const matched = trimmed.match(/^([+-]?\d+(?:\.\d+)?)/);
  if (!matched) return undefined;
  const value = Number.parseFloat(matched[1]);
  const hasUnitSuffix = matched[1].length < trimmed.length;
  if (hasUnitSuffix && !(process.env.VITEST || process.env.NODE_ENV === 'test')) {
    console.warn(`[layer-merger] threshold "${raw}" 包含单位后缀；已按数值 ${value} 解析`);
  }
  return Number.isNaN(value) ? undefined : value;
}

function normalizeThresholdEntry(
  raw: unknown,
  key: string,
  platform: string,
): ThresholdEntry {
  const asObjectEntry = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : undefined;

  const parsedValue = asObjectEntry
    ? parseThresholdNumber(asObjectEntry.value)
    : parseThresholdNumber(raw);

  if (parsedValue === undefined) {
    throw new Error(
      `平台 "${platform}" 的阈值 "${key}" 数值无效。`
      + '请使用数字或可解析的数字字符串（如 500、500ms、80%）。',
    );
  }

  const explicitDirection = asObjectEntry?.direction;
  if (explicitDirection !== undefined
      && (typeof explicitDirection !== 'string'
        || !THRESHOLD_DIRECTIONS.includes(explicitDirection as ThresholdEntry['direction']))) {
    throw new Error(`平台 "${platform}" 的阈值 "${key}" direction 无效："${String(explicitDirection)}"`);
  }

  const direction = (explicitDirection as ThresholdEntry['direction'] | undefined) || inferDirection(key);
  if (!direction) {
    throw new Error(
      `无法推断平台 "${platform}" 的阈值 "${key}" direction，请显式配置 direction 字段。`,
    );
  }

  return { value: parsedValue, direction };
}

function applyLayer2(
  gates: Record<string, GateCondition[]>,
  deliverables: Record<string, Deliverable[]>,
  thresholds: Record<string, ThresholdEntry>,
  platforms: string[],
  projectRoot: string,
): void {
  for (const platform of platforms) {
    const py = loadPlatformYaml(platform, projectRoot);

    // gate_conditions: AND 叠加（同阶段同 ID 冲突时阻断）
    if (py.gate_conditions) {
      for (const [stage, conditions] of Object.entries(py.gate_conditions)) {
        gates[stage] = gates[stage] ?? [];
        for (const cond of conditions) {
          const conflict = gates[stage].find((g) => g.id === cond.id);
          if (conflict) {
            throw new Error(
              `Gate ID 冲突：阶段 ${stage} 中存在重复 ID ${cond.id}（平台：${platform}）`,
            );
          }
          gates[stage].push(cond);
        }
      }
    }

    // extra_deliverables: 追加去重
    if (py.extra_deliverables) {
      for (const [stage, items] of Object.entries(py.extra_deliverables)) {
        deliverables[stage] = deliverables[stage] ?? [];
        if (!Array.isArray(items)) {
          throw new Error(`平台 "${platform}" 的阶段 "${stage}" 中 extra_deliverables 必须是数组`);
        }
        for (const rawItem of items) {
          const item = normalizeDeliverable(rawItem, stage, platform);
          const dup = deliverables[stage].some((d) => d.name === item.name);
          if (!dup) deliverables[stage].push(item);
        }
      }
    }

    // quality_thresholds: 取更严格值
    if (py.quality_thresholds) {
      for (const [key, rawEntry] of Object.entries(py.quality_thresholds)) {
        const entry = normalizeThresholdEntry(rawEntry, key, platform);
        const existing = thresholds[key];
        if (!existing) {
          thresholds[key] = entry;
        } else {
          // 取更严格值
          if (entry.direction === 'higher_is_better') {
            thresholds[key].value = Math.max(existing.value, entry.value);
          } else {
            thresholds[key].value = Math.min(existing.value, entry.value);
          }
        }
      }
    }
  }
}

/**
 * 三层合并主逻辑
 * Layer 0 基线 → Layer 1 Mode×Size → Layer 2 平台 YAML
 */
export function mergeLayerRules(
  mode: Mode,
  size: Size,
  platforms: string[],
  projectRoot: string,
): MergedRules {
  // Layer 0
  const gates = layer0Gates();
  const deliverables = layer0Deliverables();
  const thresholds: Record<string, ThresholdEntry> = {};

  // Layer 1
  applyLayer1(gates, deliverables, mode, size);

  // Layer 2
  if (platforms.length > 0) {
    applyLayer2(gates, deliverables, thresholds, platforms, projectRoot);
  }

  return { mode, size, platforms, gateConditions: gates, deliverables, thresholds };
}
