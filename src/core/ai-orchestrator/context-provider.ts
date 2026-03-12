/**
 * ContextProvider 抽象与注册机制
 * @see TASK-ORCH-017 新上下文类型接入不改核心组装流程
 */
import type { ContextRef } from './context-pack.js';

// ─── 类型定义 ───────────────────────────────────────────

/** 上下文提供者接口：每种上下文类型实现此接口 */
export interface ContextProvider {
  /** 唯一标识（如 'spec', 'design', 'task', 'audit'） */
  readonly id: string;
  /** 是否适用于当前阶段 */
  appliesTo(stage: string): boolean;
  /** 生成上下文引用列表 */
  provide(featureId: string, projectRoot: string, stage: string): ContextRef[];
}

/** Provider 注册表 */
const registry = new Map<string, ContextProvider>();

// ─── 注册与查询 ─────────────────────────────────────────

/** 注册一个 ContextProvider */
export function registerProvider(provider: ContextProvider): void {
  if (registry.has(provider.id)) {
    throw new Error(`ContextProvider "${provider.id}" already registered`);
  }
  registry.set(provider.id, provider);
}

/** 注销一个 ContextProvider（主要用于测试） */
export function unregisterProvider(id: string): boolean {
  return registry.delete(id);
}

/** 获取所有已注册的 Provider */
export function getProviders(): ContextProvider[] {
  return [...registry.values()];
}

/** 获取适用于指定阶段的 Provider 列表 */
export function getProvidersForStage(stage: string): ContextProvider[] {
  return [...registry.values()].filter((p) => p.appliesTo(stage));
}

/** 清空注册表（测试用） */
export function clearProviders(): void {
  registry.clear();
}

/** 收集指定阶段所有 Provider 的上下文引用 */
export function collectContextRefs(
  featureId: string,
  projectRoot: string,
  stage: string
): ContextRef[] {
  const providers = getProvidersForStage(stage);
  const refs: ContextRef[] = [];
  for (const provider of providers) {
    refs.push(...provider.provide(featureId, projectRoot, stage));
  }
  return refs;
}
