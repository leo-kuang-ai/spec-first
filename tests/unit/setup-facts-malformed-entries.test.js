'use strict';

const { normalizeSetupFacts } = require('../../src/cli/helpers/setup-facts');

describe('setup facts malformed entry handling', () => {
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
