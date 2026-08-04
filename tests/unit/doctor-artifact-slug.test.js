'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readWorkflowVerificationEvidence } = require('../../src/cli/commands/doctor');
const { slugifyArtifactPathSegment } = require('../../src/verification/artifact-paths');

describe('doctor workflow verification artifact slug', () => {
  test.each([
    ['CON', 'workspace-con'],
    ['aux.txt', 'workspace-aux.txt'],
    ['trailing. ', 'trailing'],
  ])('normalizes Windows-incompatible root basename %s', (input, expected) => {
    expect(slugifyArtifactPathSegment(input, 'workspace')).toBe(expected);
  });

  test('reads a Windows-safe evidence location for a reserved project basename', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-'));
    const projectRoot = path.join(root, 'CON');
    fs.mkdirSync(projectRoot);
    try {
      const evidence = readWorkflowVerificationEvidence(projectRoot);
      expect(evidence.path).toBe('.spec-first/workflows/verification/workspace-con/verification-evidence.json');
      expect(evidence.present).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
