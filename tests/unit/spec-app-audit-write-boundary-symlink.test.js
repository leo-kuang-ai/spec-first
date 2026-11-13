'use strict';

// 回归测试：SUP-17 - 产物写入检查漏掉指向边界外新文件的悬空符号链接
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:181-189

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// 直接测试 writeJsonOutput 和 writeTextOutput
const { writeJsonOutput, writeTextOutput } = require('../../skills/spec-app-consistency-audit/scripts/lib/audit-utils');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup17-'));
}

describe('Artifact write boundary — dangling symlink — SUP-17', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.SPEC_AUDIT_WRITE_BOUNDARY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SPEC_AUDIT_WRITE_BOUNDARY = originalEnv;
    } else {
      delete process.env.SPEC_AUDIT_WRITE_BOUNDARY;
    }
  });

  test('拒绝指向边界外已存在文件的符号链接', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      const outsideDir = path.join(root, 'outside');
      fs.mkdirSync(runDir);
      fs.mkdirSync(outsideDir);

      // 创建边界外的目标文件
      const outsideFile = path.join(outsideDir, 'target.json');
      fs.writeFileSync(outsideFile, '{"old":"content"}');

      // 在 run 内创建指向边界外的符号链接
      const symlinkPath = path.join(runDir, 'artifact.json');
      fs.symlinkSync(outsideFile, symlinkPath);

      process.env.SPEC_AUDIT_WRITE_BOUNDARY = runDir;

      // SUP-17 修复后：应该拒绝写入
      expect(() => {
        writeJsonOutput({ data: 'test' }, symlinkPath);
      }).toThrow(/escapes the run-root boundary/);

      // 验证外部文件未被修改
      expect(fs.readFileSync(outsideFile, 'utf8')).toBe('{"old":"content"}');

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('拒绝悬空符号链接（目标不存在但指向边界外）', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      const outsideDir = path.join(root, 'outside');
      fs.mkdirSync(runDir);
      fs.mkdirSync(outsideDir);

      // 创建悬空符号链接：目标路径在边界外，且目标不存在
      const outsideTarget = path.join(outsideDir, 'nonexistent.json');
      const symlinkPath = path.join(runDir, 'dangling.json');
      fs.symlinkSync(outsideTarget, symlinkPath);

      // 验证链接存在但目标不存在
      expect(fs.existsSync(symlinkPath)).toBe(false); // lstat 会看到链接，但 exists 跟随链接
      expect(fs.lstatSync(symlinkPath).isSymbolicLink()).toBe(true);

      process.env.SPEC_AUDIT_WRITE_BOUNDARY = runDir;

      // SUP-17 修复前：writeFileSync 跟随悬空链接，在边界外创建文件
      // SUP-17 修复后：应该拒绝写入
      expect(() => {
        writeJsonOutput({ data: 'test' }, symlinkPath);
      }).toThrow(/escapes the run-root boundary/);

      // 验证边界外没有创建文件
      expect(fs.existsSync(outsideTarget)).toBe(false);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('允许指向边界内文件的符号链接', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      fs.mkdirSync(runDir);

      // 创建边界内的目标文件
      const insideFile = path.join(runDir, 'target.json');
      fs.writeFileSync(insideFile, '{"old":"content"}');

      // 在 run 内创建指向边界内的符号链接
      const symlinkPath = path.join(runDir, 'link.json');
      fs.symlinkSync(insideFile, symlinkPath);

      process.env.SPEC_AUDIT_WRITE_BOUNDARY = runDir;

      // 边界内的符号链接应该允许
      writeJsonOutput({ data: 'test' }, symlinkPath);

      // 验证写入成功
      expect(JSON.parse(fs.readFileSync(insideFile, 'utf8'))).toEqual({ data: 'test' });

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('允许普通文件写入（无符号链接）', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      fs.mkdirSync(runDir);

      const normalFile = path.join(runDir, 'normal.txt');

      process.env.SPEC_AUDIT_WRITE_BOUNDARY = runDir;

      // 普通文件写入应该正常工作
      writeTextOutput('test content', normalFile);

      expect(fs.readFileSync(normalFile, 'utf8')).toBe('test content');

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('拒绝相对路径悬空符号链接指向边界外', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      const outsideDir = path.join(root, 'outside');
      fs.mkdirSync(runDir);
      fs.mkdirSync(outsideDir);

      // 使用相对路径创建悬空符号链接
      const symlinkPath = path.join(runDir, 'relative-link.json');
      fs.symlinkSync('../outside/target.json', symlinkPath);

      process.env.SPEC_AUDIT_WRITE_BOUNDARY = runDir;

      // 相对路径指向边界外也应该被拒绝
      expect(() => {
        writeTextOutput('test', symlinkPath);
      }).toThrow(/escapes the run-root boundary/);

      // 验证没有创建外部文件
      expect(fs.existsSync(path.join(outsideDir, 'target.json'))).toBe(false);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
