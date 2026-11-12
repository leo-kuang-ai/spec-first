'use strict';

// 回归测试：SUP-18 - 部分领域抽取器截断源码却不披露语义覆盖缺口
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:190-195
//
// 核心修复验证：
// 1. 大文件被截断时应在 degraded_modes 中报告
// 2. 包含截断文件路径、大小、读取字节数等元数据
// 3. 小文件不报告截断

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const extractor = path.resolve(__dirname, '../../skills/spec-app-consistency-audit/scripts/extract-engineering-quality.js');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup18-'));
}

describe('Engineering quality extractor truncation disclosure — SUP-18', () => {
  test('大文件截断时在 degraded_modes 报告', () => {
    const root = tmpDir();

    try {
      // 创建一个超过 128 KiB 的文件，尾部包含模式
      const largeContent = ' '.repeat(130 * 1024) + '\ncatch (e: Exception) {}';
      fs.writeFileSync(path.join(root, 'Main.kt'), largeContent);

      const result = JSON.parse(execFileSync(process.execPath, [extractor, '--repo-root', root], { encoding: 'utf8' }));

      // SUP-18 修复：应该报告 source_truncated
      expect(result.degraded_modes).toBeDefined();
      const truncatedMode = result.degraded_modes.find((m) => m.mode === 'source_truncated');
      expect(truncatedMode).toBeDefined();
      expect(truncatedMode.file).toBe('Main.kt');
      expect(truncatedMode.size_bytes).toBeGreaterThan(128 * 1024);
      expect(truncatedMode.bytes_read).toBeLessThan(truncatedMode.size_bytes);
      expect(truncatedMode.reason).toMatch(/truncated|tail/i);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('小文件不报告截断', () => {
    const root = tmpDir();

    try {
      // 创建一个小文件
      const smallContent = 'fun main() {\n  println("hello")\n}\n';
      fs.writeFileSync(path.join(root, 'Small.kt'), smallContent);

      const result = JSON.parse(execFileSync(process.execPath, [extractor, '--repo-root', root], { encoding: 'utf8' }));

      // 不应该有 source_truncated
      const truncatedModes = result.degraded_modes.filter((m) => m.mode === 'source_truncated');
      expect(truncatedModes).toEqual([]);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('多个大文件分别报告截断', () => {
    const root = tmpDir();

    try {
      // 创建两个大文件
      const large1 = ' '.repeat(140 * 1024) + '\ncatch (e: Exception) {}';
      const large2 = ' '.repeat(150 * 1024) + '\nwhile (true) { retry() }';
      fs.writeFileSync(path.join(root, 'File1.kt'), large1);
      fs.writeFileSync(path.join(root, 'File2.kt'), large2);

      const result = JSON.parse(execFileSync(process.execPath, [extractor, '--repo-root', root], { encoding: 'utf8' }));

      const truncatedModes = result.degraded_modes.filter((m) => m.mode === 'source_truncated');
      expect(truncatedModes.length).toBe(2);

      const file1Mode = truncatedModes.find((m) => m.file === 'File1.kt');
      const file2Mode = truncatedModes.find((m) => m.file === 'File2.kt');
      expect(file1Mode).toBeDefined();
      expect(file2Mode).toBeDefined();
      expect(file1Mode.size_bytes).toBeGreaterThan(140 * 1024);
      expect(file2Mode.size_bytes).toBeGreaterThan(150 * 1024);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('截断不影响前缀模式提取', () => {
    const root = tmpDir();

    try {
      // 大文件，但模式在前缀
      const largeContent = 'catch (e: Exception) {}\n' + ' '.repeat(140 * 1024);
      fs.writeFileSync(path.join(root, 'Prefix.kt'), largeContent);

      const result = JSON.parse(execFileSync(process.execPath, [extractor, '--repo-root', root], { encoding: 'utf8' }));

      // 应该报告截断
      const truncatedMode = result.degraded_modes.find((m) => m.mode === 'source_truncated');
      expect(truncatedMode).toBeDefined();

      // 但前缀模式应该被提取
      const swallowedExceptionCandidate = result.candidates.find(
        (c) => c.type === 'swallowed_exception' && c.file === 'Prefix.kt'
      );
      expect(swallowedExceptionCandidate).toBeDefined();

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
