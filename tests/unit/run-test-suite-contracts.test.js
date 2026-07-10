'use strict';

const {
  runJestFiles,
  runOptionalBash,
  testPathExists,
} = require('../../scripts/run-test-suite.cjs');

describe('run-test-suite legacy cleanup compatibility', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('skips missing legacy shell entrypoints without spawning bash', () => {
    expect(testPathExists('tests/unit/developer.sh')).toBe(false);

    expect(() => runOptionalBash('tests/unit/developer.sh')).not.toThrow();
    expect(logSpy).toHaveBeenCalledWith('skip missing legacy shell test: tests/unit/developer.sh');
  });

  test('skips missing fixed Jest paths without no-tests failure', () => {
    expect(testPathExists('tests/integration/verification-gate.integration.test.js')).toBe(false);

    expect(() => runJestFiles(['tests/integration/verification-gate.integration.test.js'], ['--runInBand']))
      .not.toThrow();
    expect(logSpy).toHaveBeenCalledWith(
      'skip missing legacy Jest test: tests/integration/verification-gate.integration.test.js',
    );
  });

  test('fails required Jest suites when every target is missing', () => {
    expect(() => runJestFiles(['tests/integration/retired.integration.test.js'], ['--runInBand'], {
      required: true,
      suiteName: 'integration',
    })).toThrow('integration has no active Jest tests; refusing to pass with zero checks');
    expect(logSpy).toHaveBeenCalledWith('skip missing legacy Jest test: tests/integration/retired.integration.test.js');
  });
});
