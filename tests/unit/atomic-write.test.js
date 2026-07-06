'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  createAtomicTempPath,
  writeFileAtomic,
  writeFileAtomicIfAbsent,
} = require('../../src/cli/atomic-write');
const {
  applyOperationPlan,
  writeState,
} = require('../../src/cli/state');

const STATE_SOURCE_PATH = path.join(__dirname, '..', '..', 'src', 'cli', 'state.js');

describe('atomic file write helper', () => {
  test('uses unique same-directory temporary files instead of a fixed .tmp sibling', () => {
    const filePath = path.join(os.tmpdir(), 'spec-first atomic', 'AGENTS.md');
    const first = createAtomicTempPath(filePath);
    const second = createAtomicTempPath(filePath);

    expect(path.dirname(first)).toBe(path.dirname(filePath));
    expect(path.basename(first)).toMatch(/^\.AGENTS\.md\.\d+\.\d+\.[a-f0-9]{12}\.tmp$/);
    expect(first).not.toBe(`${filePath}.tmp`);
    expect(second).not.toBe(first);
  });

  test('writes content and removes temp file after rename', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-atomic-write-'));
    const filePath = path.join(root, 'nested', 'CLAUDE.md');

    try {
      writeFileAtomic(filePath, 'first\n');
      writeFileAtomic(filePath, 'second\n');

      expect(fs.readFileSync(filePath, 'utf8')).toBe('second\n');
      expect(fs.readdirSync(path.dirname(filePath)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  function withPlatform(value, fn) {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'platform');
    Object.defineProperty(process, 'platform', { value, configurable: true });
    try {
      fn();
    } finally {
      Object.defineProperty(process, 'platform', descriptor);
    }
  }

  test('retries a transient Windows rename contention before succeeding', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-atomic-retry-'));
    const filePath = path.join(root, 'CLAUDE.md');
    const realRename = fs.renameSync;
    let calls = 0;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      calls += 1;
      if (calls < 3) {
        const error = new Error('EPERM: operation not permitted, rename');
        error.code = 'EPERM';
        throw error;
      }
      return realRename(from, to);
    });

    try {
      withPlatform('win32', () => {
        writeFileAtomic(filePath, 'retried\n');
      });
      expect(calls).toBe(3);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('retried\n');
      expect(fs.readdirSync(root).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      renameSpy.mockRestore();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('does not retry a non-contention rename error and cleans up the temp file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-atomic-nonretry-'));
    const filePath = path.join(root, 'CLAUDE.md');
    let calls = 0;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      calls += 1;
      const error = new Error('ENOSPC: no space left on device, rename');
      error.code = 'ENOSPC';
      throw error;
    });

    try {
      withPlatform('win32', () => {
        expect(() => writeFileAtomic(filePath, 'nope\n')).toThrow(/ENOSPC/);
      });
      expect(calls).toBe(1);
      expect(fs.readdirSync(root).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      renameSpy.mockRestore();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('writes once without replacing an existing file', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-atomic-write-'));
    const filePath = path.join(root, 'nested', 'run.json');

    try {
      writeFileAtomicIfAbsent(filePath, 'first\n');
      expect(() => writeFileAtomicIfAbsent(filePath, 'second\n')).toThrow(/EEXIST/);

      expect(fs.readFileSync(filePath, 'utf8')).toBe('first\n');
      expect(fs.readdirSync(path.dirname(filePath)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('state executor uses the shared atomic helper for managed writes', () => {
    const source = fs.readFileSync(STATE_SOURCE_PATH, 'utf8');

    expect(source).toContain("const { writeFileAtomic } = require('./atomic-write');");
    expect(source).toContain('writeFileAtomic(statePath,');
    expect(source).toContain('writeFileAtomic(filePath, contents);');
    expect(source).toContain("writeFileAtomic(filePath, contents || '', 'utf8');");
    expect(source).not.toContain('fs.writeFileSync(statePath,');
    expect(source).not.toContain('fs.writeFileSync(filePath,');
  });

  test('operation plan preserves buffer writes and chmod through atomic writes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-write-'));
    const textPath = path.join(root, 'runtime', 'command.md');
    const bufferPath = path.join(root, 'runtime', 'tool');

    try {
      applyOperationPlan(root, {
        operations: [
          {
            kind: 'write_file',
            path: 'runtime/command.md',
            contents: 'hello\n',
          },
          {
            kind: 'write_file',
            path: 'runtime/tool',
            contents: Buffer.from([0, 1, 2, 3]),
            encoding: 'buffer',
            mode: 0o755,
          },
        ],
      });

      expect(fs.readFileSync(textPath, 'utf8')).toBe('hello\n');
      expect([...fs.readFileSync(bufferPath)]).toEqual([0, 1, 2, 3]);
      expect(fs.statSync(bufferPath).mode & 0o777).toBe(0o755);
      expect(fs.readdirSync(path.dirname(bufferPath)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('operation plan refuses paths outside the project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-delete-'));
    const victimPath = path.join(path.dirname(root), `${path.basename(root)}-victim`);
    fs.writeFileSync(victimPath, 'do not remove\n', 'utf8');

    try {
      expect(() => applyOperationPlan(root, {
        operations: [
          {
            kind: 'remove_file',
            path: '../' + path.basename(victimPath),
          },
        ],
      })).toThrow(/outside project root/);
      expect(fs.readFileSync(victimPath, 'utf8')).toBe('do not remove\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(victimPath, { force: true });
    }
  });

  test('operation plan refuses managed writes through a symlinked runtime ancestor', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-symlink-write-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-outside-'));

    try {
      fs.symlinkSync(outside, path.join(root, '.claude'), 'dir');

      expect(() => applyOperationPlan(root, {
        operations: [
          {
            kind: 'write_file',
            path: '.claude/hooks/session-start',
            contents: 'outside write\n',
          },
        ],
      })).toThrow(/escapes project root through symlink/);
      expect(fs.existsSync(path.join(outside, 'hooks', 'session-start'))).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('operation plan refuses managed removals through a symlinked runtime root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-symlink-remove-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-outside-'));
    const outsideFile = path.join(outside, 'state.json');
    fs.writeFileSync(outsideFile, 'do not remove\n', 'utf8');

    try {
      fs.symlinkSync(outside, path.join(root, '.codex'), 'dir');

      expect(() => applyOperationPlan(root, {
        operations: [
          {
            kind: 'remove_dir',
            path: '.codex',
          },
        ],
      })).toThrow(/escapes project root through symlink/);
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('do not remove\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('operation plan refuses to remove the project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-root-'));

    try {
      expect(() => applyOperationPlan(root, {
        operations: [
          {
            kind: 'remove_dir',
            path: '.',
          },
        ],
      })).toThrow(/targets project root/);
      expect(fs.existsSync(root)).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('managed state file writes do not leave temporary files behind', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-managed-state-'));
    const adapter = { stateFile: '.codex/spec-first/state.json' };
    const stateDir = path.join(root, '.codex', 'spec-first');

    try {
      writeState(root, {
        manifestVersion: 'test',
        platform: 'codex',
        commands: [],
        skills: [],
        workflowSkills: [],
        agents: [],
        agentSupportFiles: [],
      }, adapter);

      const statePath = path.join(stateDir, 'state.json');
      expect(JSON.parse(fs.readFileSync(statePath, 'utf8'))).toMatchObject({
        manifestVersion: 'test',
        platform: 'codex',
      });
      expect(fs.readdirSync(stateDir).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
