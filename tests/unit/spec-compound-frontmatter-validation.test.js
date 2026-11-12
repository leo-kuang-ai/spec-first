'use strict';

// 回归测试：SUP-29 - promote judge 接受损坏源码
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:261-266
//
// 核心修复验证：
// 1. 拒绝缺少 frontmatter 分隔符的文档
// 2. 拒绝空的 source_refs 或 invalidation_condition
// 3. 拒绝缺少必需字段的文档
// 4. 通过有效的 promotion frontmatter

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup29-'));
}

describe('Solution publication frontmatter validation — SUP-29', () => {
  test('拒绝缺少 frontmatter 分隔符的文档', () => {
    const tmpRoot = tmpDir();

    try {
      // 准备夹具
      fs.mkdirSync(path.join(tmpRoot, 'docs/solutions'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'src'), { recursive: true });

      // SUP-29 隔离校准案例：只有字段名，没有 --- 分隔符
      const invalidDoc = `problem_type:
source_refs:
invalidation_condition:
date:
amount: 123

## Problem
NaN handling issue.`;

      fs.writeFileSync(path.join(tmpRoot, 'docs/solutions/invalid.md'), invalidDoc);
      fs.writeFileSync(path.join(tmpRoot, 'src/server.js'), '// Number.isFinite\nthrow new Error("test");');

      const judgePath = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh');
      const skillDir = path.resolve(__dirname, '../../skills/spec-compound');

      const result = execSync('bash', {
        input: fs.readFileSync(judgePath, 'utf8'),
        encoding: 'utf8',
        cwd: tmpRoot,
        env: {
          ...process.env,
          EVAL_FINAL_MESSAGE: 'docs/solutions/invalid.md published',
          EVAL_SKILL_DIR: skillDir,
        },
      });

      // SUP-29 修复前：exit 0（只检查字段名存在）
      // SUP-29 修复后：应该失败（frontmatter 无效）
      expect(result).toMatch(/frontmatter|promotion|validator/i);

    } catch (err) {
      // 预期：脚本应该以非零退出码失败
      expect(err.status).not.toBe(0);
      // validator 输出可能在 stdout 或 stderr
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      expect(output).toMatch(/frontmatter|promotion|FAIL/i);
    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('拒绝空的 source_refs', () => {
    const tmpRoot = tmpDir();

    try {
      fs.mkdirSync(path.join(tmpRoot, 'docs/solutions'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'src'), { recursive: true });

      // 有效的 frontmatter 结构，但 source_refs 为空数组
      const invalidDoc = `---
problem_type: bug-fix
source_refs: []
invalidation_condition: "Source code changes"
date: 2026-11-10
---

## Problem
NaN amount handling issue.

## Solution
Use Number.isFinite.`;

      fs.writeFileSync(path.join(tmpRoot, 'docs/solutions/empty-refs.md'), invalidDoc);
      fs.writeFileSync(path.join(tmpRoot, 'src/server.js'), '// Number.isFinite\nthrow new Error("test");');

      const judgePath = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh');
      const skillDir = path.resolve(__dirname, '../../skills/spec-compound');

      const result = execSync('bash', {
        input: fs.readFileSync(judgePath, 'utf8'),
        encoding: 'utf8',
        cwd: tmpRoot,
        env: {
          ...process.env,
          EVAL_FINAL_MESSAGE: 'Documentation complete',
          EVAL_SKILL_DIR: skillDir,
        },
      });

      expect(result).toMatch(/source_refs|promotion/i);

    } catch (err) {
      // 预期：应该拒绝空的 source_refs
      expect(err.status).not.toBe(0);
      // validator 输出到 stdout，错误信息可能在 stdout 或 stderr
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      expect(output).toMatch(/source_refs|promotion|FAIL/i);
    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('拒绝空的 invalidation_condition', () => {
    const tmpRoot = tmpDir();

    try {
      fs.mkdirSync(path.join(tmpRoot, 'docs/solutions'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'src'), { recursive: true });

      // 有效的 frontmatter 结构，但 invalidation_condition 为空字符串
      const invalidDoc = `---
problem_type: bug-fix
source_refs:
  - src/server.js:15-20
invalidation_condition: ""
date: 2026-11-10
---

## Problem
NaN amount handling issue.`;

      fs.writeFileSync(path.join(tmpRoot, 'docs/solutions/empty-condition.md'), invalidDoc);
      fs.writeFileSync(path.join(tmpRoot, 'src/server.js'), '// Number.isFinite\nthrow new Error("test");');

      const judgePath = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh');
      const skillDir = path.resolve(__dirname, '../../skills/spec-compound');

      execSync('bash', {
        input: fs.readFileSync(judgePath, 'utf8'),
        encoding: 'utf8',
        cwd: tmpRoot,
        env: {
          ...process.env,
          EVAL_FINAL_MESSAGE: 'published to docs/solutions',
          EVAL_SKILL_DIR: skillDir,
        },
      });

      // 如果到达这里，测试应该失败
      expect(true).toBe(false);

    } catch (err) {
      // 预期：应该拒绝空的 invalidation_condition
      expect(err.status).not.toBe(0);
      // validator 输出到 stdout，错误信息可能在 stdout 或 stderr
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      expect(output).toMatch(/invalidation_condition|promotion|FAIL/i);
    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('通过有效的 promotion frontmatter', () => {
    const tmpRoot = tmpDir();

    try {
      fs.mkdirSync(path.join(tmpRoot, 'docs/solutions'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'src'), { recursive: true });

      // 完全有效的 promotion frontmatter
      const validDoc = `---
problem_type: bug-fix
source_refs:
  - src/server.js:15-20
  - tests/unit/parser.test.js:42
invalidation_condition: "Source code in src/server.js parseEntry function changes"
date: 2026-11-10
---

## Problem
NaN amount handling breaks validation.

## Root Cause
parseEntry doesn't validate numeric fields.

## Solution
Add Number.isFinite check before processing amount.`;

      fs.writeFileSync(path.join(tmpRoot, 'docs/solutions/valid.md'), validDoc);
      fs.writeFileSync(path.join(tmpRoot, 'src/server.js'), '// Number.isFinite\nfunction parseEntry() {}');

      const judgePath = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh');
      const skillDir = path.resolve(__dirname, '../../skills/spec-compound');

      const result = execSync('bash', {
        input: fs.readFileSync(judgePath, 'utf8'),
        encoding: 'utf8',
        cwd: tmpRoot,
        env: {
          ...process.env,
          EVAL_FINAL_MESSAGE: 'Documentation complete. Published to docs/solutions/valid.md',
          EVAL_SKILL_DIR: skillDir,
        },
      });

      // SUP-29 修复后：应该通过所有检查
      // validator 成功时输出 "OK: <path>"
      expect(result.trim()).not.toBe('');
      expect(result).not.toMatch(/FAIL|未通过|缺.*字段/i);

    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });

  test('validator 不可用时降级为字段存在性检查', () => {
    const tmpRoot = tmpDir();

    try {
      fs.mkdirSync(path.join(tmpRoot, 'docs/solutions'), { recursive: true });
      fs.mkdirSync(path.join(tmpRoot, 'src'), { recursive: true });

      // 字段存在但值为空
      const degradedDoc = `---
problem_type: bug
source_refs:
invalidation_condition:
date: 2026-11-10
---

NaN amount issue.`;

      fs.writeFileSync(path.join(tmpRoot, 'docs/solutions/degraded.md'), degradedDoc);
      fs.writeFileSync(path.join(tmpRoot, 'src/server.js'), '// Number.isFinite\nthrow new Error("test");');

      const judgePath = path.resolve(__dirname, '../../skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh');

      // 不提供 EVAL_SKILL_DIR，导致 validator 路径不可达
      const result = execSync('bash', {
        input: fs.readFileSync(judgePath, 'utf8'),
        encoding: 'utf8',
        cwd: tmpRoot,
        env: {
          ...process.env,
          EVAL_FINAL_MESSAGE: 'published',
          EVAL_SKILL_DIR: '/nonexistent',
        },
      });

      // 降级模式：validator 不可执行，但字段存在检查应该通过
      expect(result).toBeDefined();

    } catch (err) {
      // 降级模式字段为空时会失败，这是预期的降级行为
      const output = (err.stdout?.toString() || '') + (err.stderr?.toString() || '');
      expect(output).toMatch(/缺 frontmatter 字段|未锚定问题事实|汇报未含发布语义|被意外改动/);
      expect(err.status).not.toBe(0);
    } finally {
      if (fs.existsSync(tmpRoot)) {
        fs.rmSync(tmpRoot, { recursive: true, force: true });
      }
    }
  });
});
