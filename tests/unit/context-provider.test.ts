/**
 * ContextProvider 抽象与注册机制测试
 * @see TASK-ORCH-017
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerProvider,
  unregisterProvider,
  getProviders,
  getProvidersForStage,
  clearProviders,
  collectContextRefs,
} from '../../src/core/ai-orchestrator/context-provider.js';
import type { ContextProvider } from '../../src/core/ai-orchestrator/context-provider.js';
import type { ContextRef } from '../../src/core/ai-orchestrator/context-pack.js';

beforeEach(() => {
  clearProviders();
});

function makeProvider(id: string, stages: string[]): ContextProvider {
  return {
    id,
    appliesTo: (stage) => stages.includes(stage),
    provide: () => [{ path: `${id}.md`, selector: 'summary' } as ContextRef],
  };
}

describe('registerProvider', () => {
  it('注册成功', () => {
    registerProvider(makeProvider('spec', ['01_specify']));
    expect(getProviders()).toHaveLength(1);
  });

  it('重复注册抛错', () => {
    registerProvider(makeProvider('spec', ['01_specify']));
    expect(() => registerProvider(makeProvider('spec', ['02_design']))).toThrow('already registered');
  });
});

describe('unregisterProvider', () => {
  it('注销已注册的 provider', () => {
    registerProvider(makeProvider('spec', ['01_specify']));
    expect(unregisterProvider('spec')).toBe(true);
    expect(getProviders()).toHaveLength(0);
  });

  it('注销不存在的 provider 返回 false', () => {
    expect(unregisterProvider('nonexistent')).toBe(false);
  });
});

describe('getProvidersForStage', () => {
  it('按阶段过滤', () => {
    registerProvider(makeProvider('spec', ['01_specify', '02_design']));
    registerProvider(makeProvider('task', ['03_plan', '04_implement']));
    expect(getProvidersForStage('01_specify')).toHaveLength(1);
    expect(getProvidersForStage('04_implement')).toHaveLength(1);
    expect(getProvidersForStage('06_wrap_up')).toHaveLength(0);
  });
});

describe('collectContextRefs', () => {
  it('收集适用阶段的所有引用', () => {
    registerProvider(makeProvider('spec', ['04_implement']));
    registerProvider(makeProvider('design', ['04_implement']));
    registerProvider(makeProvider('task', ['03_plan']));
    const refs = collectContextRefs('FEAT-001', '/tmp', '04_implement');
    expect(refs).toHaveLength(2);
    expect(refs.map(r => r.path)).toEqual(['spec.md', 'design.md']);
  });

  it('无适用 provider 返回空数组', () => {
    registerProvider(makeProvider('spec', ['01_specify']));
    const refs = collectContextRefs('FEAT-001', '/tmp', '04_implement');
    expect(refs).toHaveLength(0);
  });
});
