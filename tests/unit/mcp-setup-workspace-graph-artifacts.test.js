'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  codegraphArtifactHasContent,
  jsonFileHasContent,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-artifacts.cjs');

function writeArtifact(contents) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-artifact-')));
  const target = path.join(root, 'graph.json');
  fs.writeFileSync(target, contents);
  return target;
}

describe('workspace graph artifact validation', () => {
  test.each([
    '{}',
    '[]',
    ' {"nodes":[true,false,null,-12.5e+3],"escaped":"a\\n\\u4e2d\\\\\\\""} \n',
    `{"padding":"${'界'.repeat(50000)}","tail":[0,1,2]}`,
  ])('accepts complete JSON syntax without materializing the graph', (contents) => {
    expect(jsonFileHasContent(writeArtifact(contents))).toBe(true);
  });

  test.each([
    '',
    '{"trailing":true,}',
    '[1,]',
    '{"leadingZero":01}',
    '{"badEscape":"\\x"}',
    '{"unterminated":"value}',
    '{}[]',
    `{"middle":[${' '.repeat((1024 * 1024) + 64)}broken]}`,
  ])('rejects incomplete or malformed JSON syntax', (contents) => {
    expect(jsonFileHasContent(writeArtifact(contents))).toBe(false);
  });

  test('rejects invalid UTF-8 instead of accepting replacement characters', () => {
    expect(jsonFileHasContent(writeArtifact(Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d])))).toBe(false);
  });

  test('accepts a stable artifact when an ancestor only gets unrelated sibling churn', () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-artifact-sibling-')));
    const directory = path.join(root, 'graphs');
    const target = path.join(directory, 'graph.json');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(target, '{"stable":true}');
    const originalReadSync = fs.readSync;
    let churned = false;
    const readSpy = jest.spyOn(fs, 'readSync').mockImplementation((...args) => {
      if (!churned) {
        churned = true;
        fs.writeFileSync(path.join(directory, 'unrelated.tmp'), 'x');
        fs.utimesSync(directory, new Date(0), new Date(0));
      }
      return originalReadSync(...args);
    });

    try {
      expect(jsonFileHasContent(target, root)).toBe(true);
      expect(churned).toBe(true);
    } finally {
      readSpy.mockRestore();
    }
  });

  const posixSymlinkTest = process.platform === 'win32' ? test.skip : test;
  posixSymlinkTest('rejects a CodeGraph database when its parent directory changes to an external symlink before open', () => {
    const workspace = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-codegraph-parent-')));
    const repo = path.join(workspace, 'repo');
    const codegraphDir = path.join(repo, '.codegraph');
    const databasePath = path.join(codegraphDir, 'codegraph.db');
    const backupDir = path.join(repo, '.codegraph-before-swap');
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-codegraph-outside-')));
    fs.mkdirSync(codegraphDir, { recursive: true });
    fs.writeFileSync(databasePath, 'inside');
    fs.writeFileSync(path.join(outside, 'codegraph.db'), 'outside');

    const originalOpenSync = fs.openSync;
    let swapped = false;
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((filePath, ...args) => {
      if (!swapped && path.resolve(filePath) === path.resolve(databasePath)) {
        fs.renameSync(codegraphDir, backupDir);
        fs.symlinkSync(outside, codegraphDir, 'dir');
        swapped = true;
      }
      return originalOpenSync(filePath, ...args);
    });

    try {
      expect(codegraphArtifactHasContent(repo, workspace)).toBe(false);
      expect(swapped).toBe(true);
    } finally {
      openSpy.mockRestore();
      if (fs.lstatSync(codegraphDir).isSymbolicLink()) fs.rmSync(codegraphDir, { force: true });
      if (fs.existsSync(backupDir)) fs.renameSync(backupDir, codegraphDir);
    }
  });
});
