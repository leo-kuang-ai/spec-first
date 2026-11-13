'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { writeSummary, HOST_SURFACES } = require('../../scripts/verify-installed-package.cjs');
const { getSupportedPlatforms } = require('../../src/cli/adapters');

describe('installed package verification evidence', () => {
  test.each([
    [undefined, 'passed'],
    [0, 'passed'],
    [1, 'failed'],
    [2, 'failed'],
  ])('records exitCode %s as %s', (exitCode, expected) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'installed-summary-'));
    const previousDirectory = process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
    const previousExitCode = process.exitCode;
    try {
      process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR = root;
      process.exitCode = exitCode;
      writeSummary(root, 'all', '1.15.3');
      const summary = JSON.parse(fs.readFileSync(path.join(root, 'installed-package-verification.json'), 'utf8'));
      expect(summary.status).toBe(expected);
      expect(summary.phase).toBe('all');
    } finally {
      process.exitCode = previousExitCode;
      if (previousDirectory === undefined) delete process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
      else process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR = previousDirectory;
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('covers every supported host in the installed lifecycle matrix', () => {
    expect(Object.keys(HOST_SURFACES).sort()).toEqual(getSupportedPlatforms().sort());
  });
});
