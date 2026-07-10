'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('spec-mcp-setup PowerShell runner contracts', () => {
  test('keeps active PowerShell setup source scripts available for Windows mcp-setup checks', () => {
    for (const relativePath of [
      'skills/spec-mcp-setup/scripts/check-health.ps1',
      'skills/spec-mcp-setup/scripts/verify-tools.ps1',
      'skills/spec-mcp-setup/scripts/install-mcp.ps1',
      'skills/spec-mcp-setup/scripts/install-helpers.ps1',
      'skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs',
    ]) {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });
});
