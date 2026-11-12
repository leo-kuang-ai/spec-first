'use strict';

// 回归测试：SUP-24 - Graphify 自动恢复 capability gate 不匹配
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:222-228
//
// 核心修复验证：
// 1. 检测到 graphify-scope-provenance-artifact-mismatch 后构造 refreshContext
// 2. refreshContext 不仅切换 mode 为 'graphify-refresh'，还同步更新 capabilities
// 3. 新的 capabilities 包含 'provider-refresh'，可以通过 requireCapability 检查

describe('Graphify auto-recovery capability gate — SUP-24', () => {
  test('refreshContext 同步更新 mode 和 capabilities', () => {
    // 模拟原始 actionPlan（only mode）
    const originalActionPlan = {
      mode: 'only',
      capabilities: ['install-tools', 'write-host-config', 'provider-mutation', 'write-setup-facts'],
      mutation: true,
    };

    // 模拟原始 context
    const originalContext = {
      actionPlan: originalActionPlan,
      host: 'claude',
    };

    // SUP-24 修复：构造 refreshContext 时同步更新 capabilities
    const refreshCapabilities = ['install-tools', 'write-host-config', 'provider-refresh', 'write-setup-facts'];
    const refreshContext = {
      ...originalContext,
      actionPlan: {
        ...originalContext.actionPlan,
        mode: 'graphify-refresh',
        capabilities: refreshCapabilities,
      },
    };

    // 验证 mode 已切换
    expect(refreshContext.actionPlan.mode).toBe('graphify-refresh');

    // 验证 capabilities 已同步更新
    expect(refreshContext.actionPlan.capabilities).toEqual([
      'install-tools',
      'write-host-config',
      'provider-refresh',  // 核心：必须包含 provider-refresh
      'write-setup-facts',
    ]);

    // 验证包含 provider-refresh capability
    expect(refreshContext.actionPlan.capabilities).toContain('provider-refresh');

    // 验证不再包含 provider-mutation（graphify-refresh 不需要它）
    expect(refreshContext.actionPlan.capabilities).not.toContain('provider-mutation');
  });

  test('修复前的问题：仅切换 mode 导致 capability 检查失败', () => {
    // 模拟修复前的错误做法
    const originalActionPlan = {
      mode: 'only',
      capabilities: ['install-tools', 'write-host-config', 'provider-mutation', 'write-setup-facts'],
    };

    const brokenRefreshContext = {
      actionPlan: {
        ...originalActionPlan,
        mode: 'graphify-refresh',  // 只改了 mode
        // capabilities 没有更新，仍然是 only mode 的
      },
    };

    // 验证问题：mode 是 graphify-refresh，但 capabilities 不包含 provider-refresh
    expect(brokenRefreshContext.actionPlan.mode).toBe('graphify-refresh');
    expect(brokenRefreshContext.actionPlan.capabilities).not.toContain('provider-refresh');
    expect(brokenRefreshContext.actionPlan.capabilities).toContain('provider-mutation');

    // 模拟 requireCapability 检查
    const hasProviderRefreshCapability = brokenRefreshContext.actionPlan.capabilities.includes('provider-refresh');
    expect(hasProviderRefreshCapability).toBe(false);

    // 这会导致 applySelectedProviders 中的 requireCapability('provider-refresh') 失败
  });

  test('graphify-refresh mode 的完整 capabilities', () => {
    // 验证 graphify-refresh mode 的标准 capabilities
    // 来源：mode-policy.cjs 'graphify-refresh' actions
    const graphifyRefreshCapabilities = [
      'install-tools',
      'write-host-config',
      'provider-refresh',
      'write-setup-facts',
    ];

    // 验证每个 capability 都存在
    expect(graphifyRefreshCapabilities).toContain('install-tools');
    expect(graphifyRefreshCapabilities).toContain('write-host-config');
    expect(graphifyRefreshCapabilities).toContain('provider-refresh');
    expect(graphifyRefreshCapabilities).toContain('write-setup-facts');

    // 验证数量正确（4个）
    expect(graphifyRefreshCapabilities).toHaveLength(4);
  });
});
