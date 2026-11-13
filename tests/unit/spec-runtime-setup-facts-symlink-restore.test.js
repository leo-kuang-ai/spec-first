'use strict';

// 回归测试：SUP-22 - facts 写入拒绝悬空符号链接后删除原链接
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:209-214

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// 导入被测模块
const factsModule = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
const { writeSetupFacts } = factsModule;

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup22-'));
}

function setupGitRepo(root) {
  fs.mkdirSync(path.join(root, '.git'));
  fs.mkdirSync(path.join(root, '.spec-first', 'config'), { recursive: true });
}

describe('Setup facts symlink restore — SUP-22', () => {
  test('拒绝悬空符号链接时保留原链接不删除', () => {
    const root = tmpDir();
    const outsideTarget = path.join(tmpDir(), 'nonexistent.json');

    try {
      setupGitRepo(root);

      const toolFactsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');

      // 创建指向边界外不存在文件的悬空符号链接
      fs.symlinkSync(outsideTarget, toolFactsPath);

      // 验证初始状态：悬空符号链接存在
      expect(fs.lstatSync(toolFactsPath).isSymbolicLink()).toBe(true);
      expect(() => fs.statSync(toolFactsPath)).toThrow(); // 悬空

      // 尝试写入 facts（应该因 containment 拒绝）
      const result = writeSetupFacts({
        repoRoot: root,
        toolFacts: { tools: {} },
        runtimeCapabilities: { capabilities: [] },
      });

      // 应该失败并报告 symlink escape
      expect(result.status).toBe('failed');
      expect(result.complete).toBe(false);
      expect(result.diagnostic).toMatch(/symlink|escape/i);

      // 验证原悬空符号链接仍然存在（未被删除）
      expect(fs.lstatSync(toolFactsPath).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(toolFactsPath)).toBe(outsideTarget);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('拒绝时保留指向边界内文件的符号链接', () => {
    const root = tmpDir();

    try {
      setupGitRepo(root);

      const toolFactsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
      const targetPath = path.join(root, '.spec-first', 'config', 'existing.json');

      // 创建边界内目标文件
      fs.writeFileSync(targetPath, '{"original":"content"}');

      // 创建指向边界内文件的符号链接
      fs.symlinkSync(targetPath, toolFactsPath);

      // 验证初始状态
      expect(fs.lstatSync(toolFactsPath).isSymbolicLink()).toBe(true);
      expect(fs.readFileSync(toolFactsPath, 'utf8')).toBe('{"original":"content"}');

      // 注入自定义 writer 使写入失败
      let writeAttempts = 0;
      const failingWriter = () => {
        writeAttempts++;
        throw new Error('Simulated write failure');
      };

      const result = writeSetupFacts({
        repoRoot: root,
        toolFacts: { tools: {} },
        runtimeCapabilities: { capabilities: [] },
        writer: failingWriter,
      });

      // 应该失败
      expect(result.status).toBe('failed');
      expect(writeAttempts).toBeGreaterThan(0);

      // 验证原符号链接仍然存在（未被删除）
      expect(fs.lstatSync(toolFactsPath).isSymbolicLink()).toBe(true);
      expect(fs.readlinkSync(toolFactsPath)).toBe(targetPath);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('写入失败时恢复原普通文件内容', () => {
    const root = tmpDir();

    try {
      setupGitRepo(root);

      const toolFactsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');

      // 创建原始普通文件
      const originalContent = '{"original":"facts"}';
      fs.writeFileSync(toolFactsPath, originalContent);

      // 验证初始状态
      expect(fs.lstatSync(toolFactsPath).isFile()).toBe(true);
      expect(fs.readFileSync(toolFactsPath, 'utf8')).toBe(originalContent);

      // 注入自定义 writer 使写入失败
      const failingWriter = () => {
        throw new Error('Simulated write failure');
      };

      const result = writeSetupFacts({
        repoRoot: root,
        toolFacts: { tools: { new: 'data' } },
        runtimeCapabilities: { capabilities: ['new'] },
        writer: failingWriter,
      });

      // 应该失败
      expect(result.status).toBe('failed');

      // 验证原内容已恢复
      expect(fs.readFileSync(toolFactsPath, 'utf8')).toBe(originalContent);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('写入成功时两个文件都存在', () => {
    const root = tmpDir();

    try {
      setupGitRepo(root);

      const toolFactsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
      const runtimePath = path.join(root, '.spec-first', 'config', 'runtime-capabilities.json');

      // 确认文件原本不存在
      expect(fs.existsSync(toolFactsPath)).toBe(false);
      expect(fs.existsSync(runtimePath)).toBe(false);

      // 正常写入（使用默认 writer，包含 containment 检查）
      const result = writeSetupFacts({
        repoRoot: root,
        toolFacts: { tools: { test: 'value' } },
        runtimeCapabilities: { capabilities: ['test'] },
      });

      // 应该成功
      expect(result.status).toBe('ready');
      expect(result.complete).toBe(true);

      // 验证两个文件都已创建
      expect(fs.existsSync(toolFactsPath)).toBe(true);
      expect(fs.existsSync(runtimePath)).toBe(true);

      // 验证内容正确
      const toolFacts = JSON.parse(fs.readFileSync(toolFactsPath, 'utf8'));
      expect(toolFacts.tools.test).toBe('value');

      const runtime = JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
      expect(runtime.capabilities).toContain('test');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
