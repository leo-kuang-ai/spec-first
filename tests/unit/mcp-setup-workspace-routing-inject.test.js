'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  injectRoutingInstruction,
  entryFilesForHosts,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-routing-inject.cjs');
const { BLOCK_START } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-routing-instruction.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-inject-')));
}

describe('entryFilesForHosts — host → workspace entry file mapping', () => {
  test('claude → CLAUDE.md, others → AGENTS.md, deduped', () => {
    expect(entryFilesForHosts(['claude', 'codex']).sort()).toEqual(['AGENTS.md', 'CLAUDE.md']);
    expect(entryFilesForHosts(['codex', 'cursor', 'kiro', 'opencode', 'qoder'])).toEqual(['AGENTS.md']);
    expect(entryFilesForHosts(['claude'])).toEqual(['CLAUDE.md']);
  });
});

describe('injectRoutingInstruction — upsert routing block into workspace entry docs', () => {
  const repos = [{ repo_id: 'api' }, { repo_id: 'web' }];

  test('creates CLAUDE.md and AGENTS.md with the routing block when absent', () => {
    const ws = mkWorkspace();
    const result = injectRoutingInstruction({ workspaceRoot: ws, repos, hosts: ['claude', 'codex'] });
    expect(result.entries.map((e) => e.entry_file).sort()).toEqual(['AGENTS.md', 'CLAUDE.md']);
    for (const rel of ['CLAUDE.md', 'AGENTS.md']) {
      const contents = fs.readFileSync(path.join(ws, rel), 'utf8');
      expect(contents).toContain(BLOCK_START);
      expect(contents).toContain('projectPath');
      expect(contents).toContain('`api`');
    }
    expect(result.entries.every((e) => e.status === 'created')).toBe(true);
  });

  test('preserves existing content and is idempotent (upsert, single block)', () => {
    const ws = mkWorkspace();
    fs.writeFileSync(path.join(ws, 'CLAUDE.md'), '# Existing\n\nuser guidance\n');
    injectRoutingInstruction({ workspaceRoot: ws, repos, hosts: ['claude'] });
    let contents = fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8');
    expect(contents).toContain('user guidance');
    expect(contents.split(BLOCK_START).length - 1).toBe(1);

    // Second run with an extra repo → still one block, updated, content preserved.
    const second = injectRoutingInstruction({ workspaceRoot: ws, repos: [...repos, { repo_id: 'worker' }], hosts: ['claude'] });
    contents = fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8');
    expect(contents.split(BLOCK_START).length - 1).toBe(1);
    expect(contents).toContain('`worker`');
    expect(contents).toContain('user guidance');
    expect(second.entries[0].status).toBe('updated');
  });

  test('createIfAbsent=false skips a missing entry file', () => {
    const ws = mkWorkspace();
    const result = injectRoutingInstruction({ workspaceRoot: ws, repos, hosts: ['claude'], createIfAbsent: false });
    expect(result.entries[0].status).toBe('skipped');
    expect(result.entries[0].reason_code).toBe('entry-file-absent');
    expect(fs.existsSync(path.join(ws, 'CLAUDE.md'))).toBe(false);
  });

  test('dangling entry links cannot create outside files; normal creation works after recovery', () => {
    const ws = mkWorkspace();
    const outside = mkWorkspace();
    const entry = path.join(ws, 'AGENTS.md');
    const target = path.join(outside, 'absent.md');
    try {
      fs.symlinkSync(target, entry);
      const result = injectRoutingInstruction({ workspaceRoot: ws, hosts: ['codex'] });
      expect(result.entries[0]).toMatchObject({ status: 'failed', reason_code: 'routing-entry-escapes-workspace' });
      expect(fs.existsSync(target)).toBe(false);
      expect(fs.lstatSync(entry).isSymbolicLink()).toBe(true);
      fs.unlinkSync(entry);
      expect(injectRoutingInstruction({ workspaceRoot: ws, hosts: ['codex'] }).entries[0].status).toBe('created');
    } finally {
      fs.rmSync(ws, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('atomic replacement preserves outside hardlink peers and file permissions', () => {
    const ws = mkWorkspace();
    const outside = mkWorkspace();
    try {
      const target = path.join(outside, 'original.md');
      const entry = path.join(ws, 'AGENTS.md');
      fs.writeFileSync(target, '# Original content\n', { mode: 0o640 });
      fs.linkSync(target, entry);
      expect(injectRoutingInstruction({ workspaceRoot: ws, hosts: ['codex'] }).entries[0].status).toBe('updated');
      expect(fs.readFileSync(target, 'utf8')).toBe('# Original content\n');
      expect(fs.statSync(entry).mode & 0o777).toBe(fs.statSync(target).mode & 0o777);
      expect(fs.readdirSync(ws)).toEqual(['AGENTS.md']);
    } finally {
      fs.rmSync(ws, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('rejects a destination replaced by a symlink after staging and removes the temporary file', () => {
    const ws = mkWorkspace();
    const outside = mkWorkspace();
    const entry = path.join(ws, 'AGENTS.md');
    const target = path.join(outside, 'sentinel.md');
    fs.writeFileSync(entry, '# User content\n');
    fs.writeFileSync(target, 'sentinel');
    const originalWrite = fs.writeFileSync;
    const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation((filename, ...args) => {
      const result = originalWrite(filename, ...args);
      if (typeof filename === 'number') {
        fs.unlinkSync(entry);
        fs.symlinkSync(target, entry);
      }
      return result;
    });
    try {
      expect(injectRoutingInstruction({ workspaceRoot: ws, hosts: ['codex'] }).entries[0].status).toBe('failed');
      expect(fs.readFileSync(target, 'utf8')).toBe('sentinel');
      expect(fs.readdirSync(ws)).toEqual(['AGENTS.md']);
    } finally {
      spy.mockRestore();
      fs.rmSync(ws, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('six-host injection renders the shared AGENTS block with Kiro/Qoder degradation', () => {
    const ws = mkWorkspace();
    const result = injectRoutingInstruction({
      workspaceRoot: ws,
      repos,
      hosts: ['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder'],
    });

    expect(result.entries.map((entry) => entry.entry_file).sort()).toEqual(['AGENTS.md', 'CLAUDE.md']);
    const agents = fs.readFileSync(path.join(ws, 'AGENTS.md'), 'utf8');
    const claude = fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8');
    expect(agents).toContain('honest-degraded');
    expect(agents).toContain('kiro/qoder');
    expect(claude).not.toContain('honest-degraded');
  });
});
