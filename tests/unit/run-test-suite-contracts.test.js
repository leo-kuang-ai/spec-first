'use strict';

const {
  assertTestPathsExist,
  runJestFiles,
} = require('../../scripts/run-test-suite.cjs');

describe('run-test-suite active inventory', () => {
  test('accepts declared paths only when every file exists', () => {
    expect(() => assertTestPathsExist(['tests/smoke/cli-smoke.test.js'])).not.toThrow();
  });

  test('fails fast when any declared test path is missing', () => {
    expect(() => assertTestPathsExist([
      'tests/smoke/cli-smoke.test.js',
      'tests/integration/retired.integration.test.js',
    ])).toThrow('Declared test paths are missing: tests/integration/retired.integration.test.js');
  });

  test('does not run Jest when the declared path is missing', () => {
    expect(() => runJestFiles(['tests/integration/retired.integration.test.js']))
      .toThrow('Declared test paths are missing');
  });
});
