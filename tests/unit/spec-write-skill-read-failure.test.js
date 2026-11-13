'use strict';

// 回归测试：SUP-30 - 目录读取失败未传播 incomplete
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:244-249
//
// 核心修复验证：
// 1. 根目录不存在时，inspectPackage 必须返回 incomplete 而非 pass
// 2. 结果必须包含 skill_root_unreadable finding
// 3. ok 必须是 false，不能是 true

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inspectPackage } = require('../../skills/spec-write-skill/scripts/lib/package-inspection.cjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup30-'));
}

describe('Directory read failure propagation — SUP-30', () => {
  test('根目录不存在时返回 incomplete 而非 pass', () => {
    const tmpRoot = tmpDir();
    // 使用 realpath 避免符号链接段（如 macOS 的 /tmp -> /private/tmp）
    const realTmpRoot = fs.realpathSync(tmpRoot);
    const missingDir = path.join(realTmpRoot, 'missing-skill');

    try {
      // 确保目录不存在
      expect(fs.existsSync(missingDir)).toBe(false);

      // 调用 inspectPackage
      const result = inspectPackage(missingDir);

      // SUP-30 修复前：result='pass', ok=true
      // SUP-30 修复后：result='incomplete', ok=false
      expect(result.result).toBe('incomplete');
      expect(result.ok).toBe(false);

      // 必须包含 skill_root_unreadable finding
      const unreadableFinding = result.findings.find(f => f.reason_code === 'skill_root_unreadable');
      expect(unreadableFinding).toBeDefined();
      expect(unreadableFinding.status).toBe('not_checked');

      // 预算中的 exhausted 标志应为 true
      expect(result.budget.exhausted).toBe(true);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('根目录无读权限时返回 incomplete', () => {
    if (process.platform === 'win32') {
      // Windows 权限模型不同，跳过此测试
      return;
    }

    const tmpRoot = tmpDir();
    // 使用 realpath 避免符号链接段
    const realTmpRoot = fs.realpathSync(tmpRoot);
    const noAccessDir = path.join(realTmpRoot, 'no-access-skill');

    try {
      // 创建目录但移除所有权限
      fs.mkdirSync(noAccessDir);
      fs.chmodSync(noAccessDir, 0o000);

      // 调用 inspectPackage
      const result = inspectPackage(noAccessDir);

      // 应返回 incomplete
      expect(result.result).toBe('incomplete');
      expect(result.ok).toBe(false);

      // 目录本身可 lstat/realpath，但遍历失败；必须产生 unreadable finding
      const unreadableFinding = result.findings.find(f =>
        f.reason_code === 'directory_unreadable' || f.reason_code === 'skill_root_unreadable'
      );
      expect(unreadableFinding).toBeDefined();
      expect(unreadableFinding.status).toBe('not_checked');

    } finally {
      // 恢复权限以便清理
      try {
        if (fs.existsSync(noAccessDir)) {
          fs.chmodSync(noAccessDir, 0o755);
        }
      } catch (e) {}

      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('正常目录返回 pass', () => {
    const tmpRoot = tmpDir();
    // 使用 realpath 避免符号链接段
    const realTmpRoot = fs.realpathSync(tmpRoot);
    const validDir = path.join(realTmpRoot, 'valid-skill');

    try {
      // 创建有效的 skill 目录结构
      fs.mkdirSync(validDir);
      fs.writeFileSync(path.join(validDir, 'SKILL.md'), '# Test Skill\n');

      // 调用 inspectPackage
      const result = inspectPackage(validDir);

      // 正常情况应返回 pass
      expect(result.result).toBe('pass');
      expect(result.ok).toBe(true);

      // 不应有 skill_root_unreadable finding
      const unreadableFinding = result.findings.find(f => f.reason_code === 'skill_root_unreadable');
      expect(unreadableFinding).toBeUndefined();

      // 应包含 SKILL.md
      expect(result.regular_file_inventory).toContain('SKILL.md');

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });
});
