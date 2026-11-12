'use strict';

// 回归测试：SUP-27 - setup 语义边界判据漏检管道写入
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:275-280
//
// 核心修复验证：
// 1. `cat README.md | touch unauthorized.txt` 应被拒绝（管道后有写入命令）
// 2. `cat README.md | grep pattern` 应通过（管道都是只读命令）
// 3. 保持现有 `;`、`&&`、`||` 分段逻辑

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup27-'));
}

describe('Setup scope pipeline write detection — SUP-27', () => {
  test('拒绝管道后的写入命令', () => {
    const tmpRoot = tmpDir();

    try {
      // 准备夹具
      fs.writeFileSync(path.join(tmpRoot, 'README.md'), '# Test\n');

      // 提取 readOnlyBash 函数并测试
      const judgePath = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh');
      const judgeContent = fs.readFileSync(judgePath, 'utf8');

      // 提取 readOnlyBash 函数定义
      const functionMatch = judgeContent.match(/const readOnlyBash = \(command\) => \{[\s\S]*?\n  \};/);
      expect(functionMatch).toBeTruthy();

      const readOnlyBashCode = functionMatch[0];

      // 构造测试环境
      const testScript = `
        const assert = { ok: (v, msg) => { if (!v) throw new Error(msg); } };
        ${readOnlyBashCode}

        // SUP-27 修复前：返回 true（只检查 cat，忽略 touch）
        // SUP-27 修复后：返回 false（检测到管道后的 touch 写入）
        const result = readOnlyBash('cat README.md | touch unauthorized.txt');
        console.log(JSON.stringify({ result }));
      `;

      const result = execSync('node', {
        input: testScript,
        encoding: 'utf8',
        cwd: tmpRoot,
      });

      const parsed = JSON.parse(result.trim());

      // SUP-27 修复后应拒绝
      expect(parsed.result).toBe(false);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('允许管道只读命令', () => {
    const tmpRoot = tmpDir();

    try {
      fs.writeFileSync(path.join(tmpRoot, 'README.md'), '# Test\npattern\n');

      const judgePath = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh');
      const judgeContent = fs.readFileSync(judgePath, 'utf8');
      const functionMatch = judgeContent.match(/const readOnlyBash = \(command\) => \{[\s\S]*?\n  \};/);
      const readOnlyBashCode = functionMatch[0];

      const testScript = `
        const assert = { ok: (v, msg) => { if (!v) throw new Error(msg); } };
        ${readOnlyBashCode}

        // 合法的管道只读命令应该通过
        const result = readOnlyBash('cat README.md | grep pattern');
        console.log(JSON.stringify({ result }));
      `;

      const result = execSync('node', {
        input: testScript,
        encoding: 'utf8',
        cwd: tmpRoot,
      });

      const parsed = JSON.parse(result.trim());
      expect(parsed.result).toBe(true);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('保持现有分号分段逻辑', () => {
    const tmpRoot = tmpDir();

    try {
      const judgePath = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh');
      const judgeContent = fs.readFileSync(judgePath, 'utf8');
      const functionMatch = judgeContent.match(/const readOnlyBash = \(command\) => \{[\s\S]*?\n  \};/);
      const readOnlyBashCode = functionMatch[0];

      const testScript = `
        const assert = { ok: (v, msg) => { if (!v) throw new Error(msg); } };
        ${readOnlyBashCode}

        // 分号分隔的每段都是只读应该通过
        const result1 = readOnlyBash('cat file1.txt; cat file2.txt');
        // 分号分隔但有写入应拒绝
        const result2 = readOnlyBash('cat file1.txt; touch file2.txt');

        console.log(JSON.stringify({ result1, result2 }));
      `;

      const result = execSync('node', {
        input: testScript,
        encoding: 'utf8',
        cwd: tmpRoot,
      });

      const parsed = JSON.parse(result.trim());
      expect(parsed.result1).toBe(true);
      expect(parsed.result2).toBe(false);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('混合管道和分号', () => {
    const tmpRoot = tmpDir();

    try {
      const judgePath = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals/fixtures/scripts/check-not-setup-scope.sh');
      const judgeContent = fs.readFileSync(judgePath, 'utf8');
      const functionMatch = judgeContent.match(/const readOnlyBash = \(command\) => \{[\s\S]*?\n  \};/);
      const readOnlyBashCode = functionMatch[0];

      const testScript = `
        const assert = { ok: (v, msg) => { if (!v) throw new Error(msg); } };
        ${readOnlyBashCode}

        // 第一段管道只读，第二段单命令只读 -> 通过
        const result1 = readOnlyBash('cat file.txt | grep pattern; ls');
        // 第一段管道只读，第二段管道有写入 -> 拒绝
        const result2 = readOnlyBash('cat file.txt | grep pattern; cat data | touch out');

        console.log(JSON.stringify({ result1, result2 }));
      `;

      const result = execSync('node', {
        input: testScript,
        encoding: 'utf8',
        cwd: tmpRoot,
      });

      const parsed = JSON.parse(result.trim());
      expect(parsed.result1).toBe(true);
      expect(parsed.result2).toBe(false);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });
});
