'use strict';

const fs = require('node:fs');
const path = require('node:path');

const WORKFLOW_PATH = path.join(__dirname, '..', '..', '.github', 'workflows', 'npm-install-matrix.yml');

describe('npm install matrix workflow', () => {
  test('covers Windows recommended Node lines and verifies doctor native facts', () => {
    const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

    expect(workflow).toContain('os: [ubuntu-latest, macos-latest, windows-latest]');
    expect(workflow).toContain('node: [20, 22, 24]');
    expect(workflow).toContain("spawnSync(shim, ['doctor', '--json']");
    expect(workflow).toContain('doctorPayload.native_modules');
    expect(workflow).toContain('doctorPayload.native_modules.crg_status');
  });
});
