'use strict';

const { resolveReadinessPolicy, applyReadinessPolicy } = require('../../skills/spec-runtime-setup/scripts/lib/baseline-policy.cjs');

describe('按请求 scope 计算 readiness blocker', () => {
  const gh = { id: 'gh', required: true, baseline_blocking: true, readiness_policy: 'workflow-required', required_for: ['spec-commit-push-pr'] };
  test('registry 的用途声明不能自动命中当前需求', () => {
    expect(resolveReadinessPolicy(gh)).toMatchObject({ blocking: false, demand_source: 'not-requested', matched_rule: null });
    expect(resolveReadinessPolicy(gh, { workflows: ['spec-plan'] }).blocking).toBe(false);
  });
  test('显式选择优先，workflow 精确匹配，不解析自然语言', () => {
    expect(resolveReadinessPolicy(gh, { selectedIds: ['gh'] })).toMatchObject({ blocking: true, demand_source: 'explicit-selection' });
    expect(resolveReadinessPolicy(gh, { workflows: ['spec-commit-push-pr'] })).toMatchObject({ blocking: true, matched_rule: 'spec-commit-push-pr' });
    expect(resolveReadinessPolicy(gh, { workflows: ['please run spec-commit-push-pr'] }).blocking).toBe(false);
  });
  test('未知旧条目保留旧阻断语义并报告迁移警告', () => {
    expect(resolveReadinessPolicy({ id: 'legacy', required: true })).toMatchObject({ blocking: true, migration_warning: 'legacy-readiness-policy' });
    expect(resolveReadinessPolicy({ id: 'legacy', baseline_blocking: false }).blocking).toBe(false);
  });
  test('为每次请求生成独立投影，不污染 registry 或其他 child', () => {
    const registry = { helpers: [gh], tools: [] };
    const selected = applyReadinessPolicy(registry, { selectedIds: ['gh'] });
    const idle = applyReadinessPolicy(registry);
    expect(selected.helpers[0]).toMatchObject({ required: true, baseline_blocking: true });
    expect(idle.helpers[0]).toMatchObject({ required: false, baseline_blocking: false });
    expect(registry.helpers[0]).toBe(gh);
    expect(gh.required).toBe(true);
  });
});
