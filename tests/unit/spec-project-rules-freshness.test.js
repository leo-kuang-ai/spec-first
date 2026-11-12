'use strict';

// 回归测试：SUP-20/21 - 知识保鲜问题
// SUP-20: 知识保鲜漏掉目录内未跟踪的新源码，错误触发免重验路径
// SUP-21: 反引号住址的闭合符被吞入路径，合法引用被误报失效
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:197-207

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, execSync } = require('node:child_process');

const extractor = path.resolve(__dirname, '../../skills/spec-project-rules/scripts/extract-deps.cjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup20-'));
}

function git(root, ...args) {
  return execSync(`git ${args.join(' ')}`, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

describe('Knowledge freshness — SUP-20/21', () => {
  test('SUP-20: 未跟踪新文件标记为 dirty', () => {
    const root = tmpDir();

    try {
      // 初始化 git 仓库
      git(root, 'init');
      git(root, 'config user.name "test"');
      git(root, 'config user.email "test@test"');

      // 创建 npm workspace 结构
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
        name: 'root',
        workspaces: ['packages/*']
      }));
      fs.mkdirSync(path.join(root, 'packages', 'shared'), { recursive: true });
      fs.writeFileSync(path.join(root, 'packages', 'shared', 'package.json'), JSON.stringify({ name: 'shared' }));

      // 创建知识库（带 source_commit frontmatter）
      fs.mkdirSync(path.join(root, 'docs', 'solutions'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'docs', 'architecture.md'),
        '---\nsource_commit: HEAD\n---\n# Architecture\n\n## 复用 Dependencies\n\n- 住址 packages/shared | 复用原因：共享工具库 | 复用类型：npm-package\n'
      );

      git(root, 'add .');
      git(root, 'commit -m "baseline"');

      // 创建未跟踪的新文件
      fs.writeFileSync(path.join(root, 'packages', 'shared', 'new.ts'), 'export const x = 1;');

      // 验证未跟踪文件存在
      const untracked = git(root, 'ls-files --others --exclude-standard');
      expect(untracked).toContain('packages/shared/new.ts');

      // SUP-20 修复前：verify_status=clean
      // SUP-20 修复后：应该检测到未跟踪文件，verify_status=dirty
      const result = JSON.parse(
        execFileSync(process.execPath, [extractor, root, '--verify', '--freshness'], { encoding: 'utf8' })
      );

      expect(result.freshness.status).toBe('dirty');
      expect(result.freshness.dirty_refs.length).toBeGreaterThan(0);
      const dirtyRef = result.freshness.dirty_refs.find((r) => r.includes('packages/shared'));
      expect(dirtyRef).toBeDefined();

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('SUP-21: 反引号住址正确解析，不包含闭合符', () => {
    const root = tmpDir();

    try {
      // 初始化 git 仓库
      git(root, 'init');
      git(root, 'config user.name "test"');
      git(root, 'config user.email "test@test"');

      // 创建 npm workspace 结构
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
        name: 'root',
        workspaces: ['packages/*']
      }));
      fs.mkdirSync(path.join(root, 'packages', 'shared'), { recursive: true });
      fs.writeFileSync(path.join(root, 'packages', 'shared', 'package.json'), JSON.stringify({ name: 'shared' }));
      fs.writeFileSync(path.join(root, 'packages', 'shared', 'index.ts'), 'export {};');

      // 知识库使用反引号包裹住址
      fs.mkdirSync(path.join(root, 'docs', 'solutions'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'docs', 'architecture.md'),
        '---\nsource_commit: HEAD\n---\n# Architecture\n\n## 复用 Dependencies\n\n- 住址 `packages/shared` | 复用原因：共享工具库 | 复用类型：npm-package\n'
      );

      git(root, 'add .');
      git(root, 'commit -m "baseline"');

      // SUP-21 修复前：missing_refs 包含 "packages/shared`"（带反引号）
      // SUP-21 修复后：应该正确解析为 "packages/shared"，不报告 missing
      const result = JSON.parse(
        execFileSync(process.execPath, [extractor, root, '--verify'], { encoding: 'utf8' })
      );

      expect(result.verify.verify_status).toBe('clean');
      expect(result.verify.missing_refs).toEqual([]);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('SUP-21: 无反引号住址仍然工作', () => {
    const root = tmpDir();

    try {
      git(root, 'init');
      git(root, 'config user.name "test"');
      git(root, 'config user.email "test@test"');

      // 创建 npm workspace 结构
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
        name: 'root',
        workspaces: ['packages/*']
      }));
      fs.mkdirSync(path.join(root, 'packages', 'src'), { recursive: true });
      fs.writeFileSync(path.join(root, 'packages', 'src', 'package.json'), JSON.stringify({ name: 'src' }));
      fs.writeFileSync(path.join(root, 'packages', 'src', 'main.ts'), 'export {};');

      // 无反引号住址
      fs.mkdirSync(path.join(root, 'docs', 'solutions'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'docs', 'architecture.md'),
        '---\nsource_commit: HEAD\n---\n# Architecture\n\n## 复用 Dependencies\n\n- 住址 packages/src | 复用原因：核心代码 | 复用类型：npm-package\n'
      );

      git(root, 'add .');
      git(root, 'commit -m "baseline"');

      const result = JSON.parse(
        execFileSync(process.execPath, [extractor, root, '--verify'], { encoding: 'utf8' })
      );

      expect(result.verify.verify_status).toBe('clean');
      expect(result.verify.missing_refs).toEqual([]);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('SUP-20: staged 新文件也标记为 dirty', () => {
    const root = tmpDir();

    try {
      git(root, 'init');
      git(root, 'config user.name "test"');
      git(root, 'config user.email "test@test"');

      // 创建 npm workspace 结构
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
        name: 'root',
        workspaces: ['packages/*']
      }));
      fs.mkdirSync(path.join(root, 'packages', 'lib'), { recursive: true });
      fs.writeFileSync(path.join(root, 'packages', 'lib', 'package.json'), JSON.stringify({ name: 'lib' }));
      fs.writeFileSync(path.join(root, 'packages', 'lib', 'old.ts'), 'export {};');

      fs.mkdirSync(path.join(root, 'docs', 'solutions'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'docs', 'architecture.md'),
        '---\nsource_commit: HEAD\n---\n# Architecture\n\n## 复用 Dependencies\n\n- 住址 packages/lib | 复用原因：工具库 | 复用类型：npm-package\n'
      );

      git(root, 'add .');
      git(root, 'commit -m "baseline"');

      // 添加新文件并 stage
      fs.writeFileSync(path.join(root, 'packages', 'lib', 'new.ts'), 'export const y = 2;');
      git(root, 'add packages/lib/new.ts');

      const result = JSON.parse(
        execFileSync(process.execPath, [extractor, root, '--verify', '--freshness'], { encoding: 'utf8' })
      );

      expect(result.freshness.status).toBe('dirty');

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
