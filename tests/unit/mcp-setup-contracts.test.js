'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('spec-mcp-setup runner contracts', () => {
  test('keeps active setup source scripts available for the npm test:mcp-setup suite', () => {
    for (const relativePath of [
      'skills/spec-mcp-setup/scripts/check-health',
      'skills/spec-mcp-setup/scripts/verify-tools.sh',
      'skills/spec-mcp-setup/scripts/install-mcp.sh',
      'skills/spec-mcp-setup/scripts/install-helpers.sh',
      'skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs',
    ]) {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });
});
