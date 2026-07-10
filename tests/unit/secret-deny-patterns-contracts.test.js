'use strict';

const {
  isExactRepoRelativePath,
  isSecretDeniedPath,
  readContract,
} = require('../../src/cli/helpers/secret-deny-patterns');

describe('secret deny path contract', () => {
  test('denies credential-like files while preserving documented examples', () => {
    expect(isSecretDeniedPath('.env')).toBe(true);
    expect(isSecretDeniedPath('config/service-token.json')).toBe(true);
    expect(isSecretDeniedPath('.env.example')).toBe(false);
  });

  test('allowlisted contract files remain usable as task targets', () => {
    for (const filePath of readContract().allowlist) {
      expect(isSecretDeniedPath(filePath)).toBe(false);
    }
  });

  test('requires exact repo-relative paths', () => {
    expect(isExactRepoRelativePath('src/example.js')).toBe(true);
    expect(isExactRepoRelativePath('../outside.js')).toBe(false);
    expect(isExactRepoRelativePath('src/*.js')).toBe(false);
  });
});
