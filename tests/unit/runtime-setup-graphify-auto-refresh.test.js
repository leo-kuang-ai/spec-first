'use strict';

// 回归测试：SUP-24 - Graphify 自动恢复只改 mode，未对应能力门，必然被拒绝
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:223-228

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const mockCalls = [];

jest.mock('../../skills/spec-runtime-setup/scripts/providers/registry.cjs', () => ({
  graphify: {
    plan: () => ({ blocked: false }),
    apply: () => {
      mockCalls.push({ call: 'apply' });
      return {
        provider: 'graphify',
        reason_code: 'graphify-scope-provenance-artifact-mismatch',
        readiness_status: 'degraded',
        lifecycle: {},
        limitations: [],
      };
    },
    refresh: () => {
      mockCalls.push({ call: 'refresh' });
      return {
        provider: 'graphify',
        reason_code: 'graphify-scope-provenance-artifact-refreshed',
        readiness_status: 'ready',
        lifecycle: {},
        limitations: [],
      };
    },
    verify: () => ({
      provider: 'graphify',
      readiness_status: 'unknown',
      lifecycle: {},
      limitations: [],
    }),
    reconcileConfigured: (readiness) => readiness,
  },
}));

const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
const { runVerificationOrMutation } = require('../../skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs');

function tmpDir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sup24-')));
}

describe('Graphify auto refresh capability — SUP-24', () => {
  test('provenance mismatch 自动刷新不再被 provider-refresh 能力门拒绝', () => {
    mockCalls.length = 0;
    const root = tmpDir();
    const registry = {
      providers: [{ id: 'graphify', kind: 'graph', profile: 'optional' }],
      tools: [],
      helpers: [],
    };
    const actionPlan = buildActionPlan({ argv: ['--only', 'graphify'], knownIds: ['graphify'] });
    expect(actionPlan.blocked).toBe(false);
    expect(actionPlan.capabilities).toContain('provider-mutation');
    expect(actionPlan.capabilities).not.toContain('provider-refresh');

    const context = {
      skillRoot: path.resolve(__dirname, '../../skills/spec-runtime-setup'),
      setupScriptDir: path.resolve(__dirname, '../../skills/spec-runtime-setup/scripts'),
      homeDir: root,
      env: {},
      host: 'codex',
      platform: 'linux',
      registry,
      effectiveRegistry: registry,
      actionPlan,
      target: { repo_status: 'not-git-repo', target_root: root },
      runner: () => ({ exit_code: 0, stdout: '', stderr: '' }),
    };

    let result;
    try {
      result = runVerificationOrMutation(context, root);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }

    // 修复前：第二次 apply 直接抛 setup-capability-denied: provider-refresh
    expect(mockCalls.map((entry) => entry.call)).toEqual(['apply', 'refresh']);
    expect(result.mode).toBe('only');
    expect(JSON.stringify(result)).not.toMatch(/setup-capability-denied/);
  });
});
