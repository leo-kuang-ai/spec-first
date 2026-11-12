'use strict';

// 回归测试：失败恢复批次（SUP-22/23/26/32）
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
const { buildWorkspaceGraphs } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'recovery-'));
}

describe('facts.cjs recovery — SUP-22', () => {
  test('拒绝悬空符号链接后，不删除原链接', () => {
    const root = tmpDir();
    const configDir = path.join(root, '.spec-first', 'config');
    const factsPath = path.join(configDir, 'tool-facts.json');
    const outside = path.join(root, 'outside-boundary');

    fs.mkdirSync(configDir, { recursive: true });
    fs.symlinkSync(path.join(outside, 'nowhere.json'), factsPath);

    const result = writeSetupFacts({
      repoRoot: root,
      toolFacts: {},
      runtimeCapabilities: {},
    });

    expect(result.status).toBe('failed');
    expect(result.complete).toBe(false);
    // 原链接必须保留，不能被回滚删除
    expect(fs.lstatSync(factsPath).isSymbolicLink()).toBe(true);

    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe('workspace-graph-build.cjs recovery — SUP-26/32', () => {
  function fakeRunners() {
    return {
      codegraphInstallGlobal: () => ({ ok: true }),
      codegraphInit: () => ({ ok: true }),
      graphifyExtract: () => ({ ok: false, reason_code: 'stub' }),
    };
  }

  function fakeWriters() {
    return {
      excludeWriter: () => ({ ok: true }),
      stateWriter: () => ({ ok: true, path: null }),
    };
  }

  test('备份 rename 失败后，不删除原 .codegraph（SUP-26）', () => {
    const ws = tmpDir();
    const child = path.join(ws, 'child');
    const cg = path.join(child, '.codegraph');
    const originalFile = path.join(cg, 'original.txt');

    fs.mkdirSync(cg, { recursive: true });
    fs.writeFileSync(originalFile, 'user content');

    const originalRenameSync = fs.renameSync;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((src, dest) => {
      if (src === cg && dest.includes('.spec-first-previous-')) {
        const err = new Error('EACCES');
        err.code = 'EACCES';
        throw err;
      }
      originalRenameSync(src, dest);
    });

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos: [{ repo_id: 'child', git_root: child }],
      runners: fakeRunners(),
      ...fakeWriters(),
      deferFinalState: true,
    });

    renameSpy.mockRestore();

    expect(result.repos[0].reason_code).toBe('codegraph-refresh-failed');
    // 备份失败时，原索引必须保留
    expect(fs.existsSync(originalFile)).toBe(true);
    expect(fs.readFileSync(originalFile, 'utf8')).toBe('user content');

    fs.rmSync(ws, { recursive: true, force: true });
  });

  test('containment 拒绝逃逸链接后，不删除该链接（SUP-32）', () => {
    const ws = tmpDir();
    const child = path.join(ws, 'child');
    const outside = path.join(ws, 'outside');
    const cg = path.join(child, '.codegraph');
    const keepFile = path.join(outside, 'keep.txt');

    fs.mkdirSync(child, { recursive: true });
    fs.mkdirSync(outside);
    fs.writeFileSync(keepFile, 'external');
    fs.symlinkSync(outside, cg);

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos: [{ repo_id: 'child', git_root: child }],
      runners: fakeRunners(),
      ...fakeWriters(),
      deferFinalState: true,
    });

    expect(result.repos[0].reason_code).toBe('codegraph-target-escapes-workspace');
    // 安全拒绝后，用户的链接必须保留
    expect(fs.lstatSync(cg).isSymbolicLink()).toBe(true);
    expect(fs.existsSync(keepFile)).toBe(true);

    fs.rmSync(ws, { recursive: true, force: true });
  });
});
