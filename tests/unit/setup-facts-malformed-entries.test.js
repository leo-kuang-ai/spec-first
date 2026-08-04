'use strict';

const { normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');

describe('setup facts malformed entry handling', () => {
  test('keeps installed helper facts separate from blocked browser execution readiness', () => {
    const normalized = normalizeSetupFacts({
      schema_version: 'tool-facts.v2',
      generated_at: new Date().toISOString(),
      profile: 'recommended',
      items: [{
        id: 'agent-browser',
        kind: 'browser-helper',
        required: true,
        baseline_blocking: false,
        dependency_status: 'ready',
        configured_status: 'not-applicable',
        result: 'degraded',
        reason_code: 'exact-origin-capability-unavailable',
        installed: true,
        missing_dependency_reason: null,
        execution_readiness: 'blocked',
        conformance_status: 'not_run',
        repair_scope: 'provider',
        next_action: '等待 provider release。',
      }],
      configured_dependencies: [],
      provider_readiness: [],
    });

    expect(normalized.items[0]).toMatchObject({
      dependency_status: 'ready',
      installed: true,
      result: 'degraded',
      reason_code: 'exact-origin-capability-unavailable',
      execution_readiness: 'blocked',
      conformance_status: 'not_run',
      repair_scope: 'provider',
      next_action: '等待 provider release。',
    });
  });

  test.each([
    { schema_version: 'tool-facts.v1', tools: { context7: null } },
    { schema_version: 'tool-facts.v1', helper_tools: { gh: null } },
    { schema_version: 'tool-facts.v2', items: [null] },
    { schema_version: 'tool-facts.v2', items: [], configured_dependencies: [null] },
    { schema_version: 'tool-facts.v2', items: [], provider_readiness: [null] },
  ])('returns structured invalid projection for null entries', (facts) => {
    expect(normalizeSetupFacts(facts)).toMatchObject({
      status: 'error',
      reason_code: 'setup-facts-invalid',
      items: [],
      configured_dependencies: [],
      provider_readiness: [],
    });
  });
});
