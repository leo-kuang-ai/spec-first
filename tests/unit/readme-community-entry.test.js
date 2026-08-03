'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const readmePath = path.join(repoRoot, 'README.md');
const readmeZhPath = path.join(repoRoot, 'README.zh-CN.md');
const readme = fs.readFileSync(readmePath, 'utf8');
const readmeZh = fs.readFileSync(readmeZhPath, 'utf8');

function headings(markdown) {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
}

function section(markdown, heading) {
  const start = markdown.indexOf(`## ${heading}`);
  if (start < 0) return '';
  const remaining = markdown.slice(start);
  const next = remaining.indexOf('\n## ', 4);
  return next < 0 ? remaining : remaining.slice(0, next);
}

function expectOrdered(content, values) {
  let cursor = -1;
  for (const value of values) {
    const next = content.indexOf(value);
    expect(next).toBeGreaterThan(cursor);
    cursor = next;
  }
}

function repositoryLinks(markdown) {
  const root = 'https://github.com/sunrain520/spec-first/blob/main/';
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1])
    .filter((target) => target.startsWith(root))
    .map((target) => decodeURIComponent(target.slice(root.length).split('#')[0]));
}

describe('README community entry contract', () => {
  test('keeps a compact mirrored information architecture', () => {
    expect(headings(readme)).toEqual([
      'See It In 90 Seconds',
      'Why spec-first?',
      'Quickstart',
      'What You Get',
      'Core Workflows',
      'Trust Model',
      'Host Support',
      'Documentation',
      'CLI Reference',
      'Development & Contributing',
    ]);
    expect(headings(readmeZh)).toEqual([
      '90 秒看懂',
      '为什么使用 spec-first？',
      '快速开始',
      '你能得到什么',
      '核心 Workflows',
      '信任模型',
      '宿主支持',
      '相关文档',
      'CLI 参考',
      '开发与贡献',
    ]);
    expect(Buffer.byteLength(readme)).toBeLessThanOrEqual(16 * 1024);
    expect(Buffer.byteLength(readmeZh)).toBeLessThanOrEqual(16 * 1024);
  });

  test('keeps the first-run path short and observable', () => {
    expectOrdered(readme, [
      'npm install -g spec-first',
      'spec-first quickstart',
      'Restart the selected host',
      'spec-brainstorm "Improve onboarding for first-time CLI users"',
      'docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md',
    ]);
    expectOrdered(readmeZh, [
      'npm install -g spec-first',
      'spec-first quickstart',
      '重启已选择的宿主',
      'spec-brainstorm "改进 CLI 新用户的 onboarding"',
      'docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.md',
    ]);

    for (const quickstart of [section(readme, 'Quickstart'), section(readmeZh, '快速开始')]) {
      expect(quickstart).toContain('Node.js `>=20.0.0`');
      expect(quickstart).toContain('spec-first init --codex -y -u <name> --lang <zh|en>');
      for (const implementationDetail of [
        'Graphify',
        'CodeGraph',
        'workspace-graph',
        'core.hooksPath',
        'opencode.json',
        'agent-browser',
        'CAS',
      ]) {
        expect(quickstart).not.toContain(implementationDetail);
      }
    }
  });

  test('keeps core workflows, trust claims, and host posture equivalent', () => {
    const sharedClaims = [
      'spec-ideate',
      'spec-brainstorm',
      'spec-prd',
      'spec-plan',
      'spec-write-tasks',
      'spec-work',
      'spec-debug',
      'spec-doc-review',
      'spec-code-review',
      'spec-compound',
      'Claude Code',
      'Codex',
      'Kiro',
      'Qoder',
      'Cursor',
      'OpenCode',
      'generated_runtime_preview',
      'docs/contracts/source-runtime-customization-boundary.md',
      'docs/catalog/runtime-capabilities.md',
    ];
    for (const claim of sharedClaims) {
      expect(readme).toContain(claim);
      expect(readmeZh).toContain(claim);
    }

    for (const markdown of [readme, readmeZh]) {
      for (const referenceDetail of [
        '.opencode/commands/spec-*.md',
        'opencode.jsonc',
        'core.hooksPath',
        'workspace-child-hook-contract',
        'exact-origin-capability-unavailable',
      ]) {
        expect(markdown).not.toContain(referenceDetail);
      }
    }
  });

  test('keeps open-source trust signals and repository links valid', () => {
    for (const markdown of [readme, readmeZh]) {
      expect(markdown).toContain('[![npm version]');
      expect(markdown).toContain('[![license]');
      expect(markdown).toContain('npm-install-matrix.yml');
      expect(markdown).toContain('http://spec-first.cn/');
      for (const target of repositoryLinks(markdown)) {
        expect(fs.existsSync(path.join(repoRoot, target))).toBe(true);
      }
    }
    expect(fs.existsSync(path.join(
      repoRoot,
      'docs/assets/readme/spec-first-cli-workflow-demo.svg',
    ))).toBe(true);
  });
});
