'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  writeFileAtomic,
  writeFileAtomicIfAbsent,
} = require('../../src/cli/atomic-write');

const tempRoots = [];

afterEach(() => {
  jest.restoreAllMocks();
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('atomic write failure evidence', () => {
  test.each([
    ['writeFileAtomic', writeFileAtomic],
    ['writeFileAtomicIfAbsent', writeFileAtomicIfAbsent],
  ])('%s preserves the primary error when temp cleanup also fails', (_name, writer) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-atomic-failure-'));
    tempRoots.push(root);
    const targetPath = path.join(root, 'target.txt');
    const primaryError = Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    const cleanupError = Object.assign(new Error('cleanup denied'), { code: 'EACCES' });
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw primaryError;
    });
    const cleanupSpy = jest.spyOn(fs, 'rmSync').mockImplementation(() => {
      throw cleanupError;
    });

    let thrown;
    try {
      writer(targetPath, 'contents\n', 'utf8');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBe(primaryError);
    expect(thrown).toMatchObject({
      code: 'ENOSPC',
      message: 'disk full',
      atomicTempCleanupError: cleanupError,
    });
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
    expect(cleanupSpy).toHaveBeenCalledWith(expect.stringContaining('.target.txt.'), {
      force: true,
    });
  });
});
