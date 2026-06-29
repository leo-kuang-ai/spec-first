'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const PROJECT_REVIEW_DOCS_ROOT = path.join(REPO_ROOT, 'docs', '项目审查');

function listMarkdownFiles(dirPath) {
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(entryPath);
    if (entry.isFile() && entry.name.endsWith('.md')) return [entryPath];
    return [];
  });
}

describe('project review docs contracts', () => {
  test('project review docs avoid machine-local markdown links', () => {
    for (const docPath of listMarkdownFiles(PROJECT_REVIEW_DOCS_ROOT)) {
      const content = fs.readFileSync(docPath, 'utf8');
      const relativePath = path.relative(REPO_ROOT, docPath);

      if (content.includes('/Users/kuang')) {
        throw new Error(`${relativePath} contains a machine-local absolute repo path`);
      }
      if (content.includes('file://')) {
        throw new Error(`${relativePath} contains a file:// link`);
      }
    }
  });

  // R-37: README 必须有审查索引与 active recommendations 指针,且最新审查在索引中在场。
  test('review README carries an index and active-recommendations pointer with the latest review present', () => {
    const readmePath = path.join(PROJECT_REVIEW_DOCS_ROOT, 'README.md');
    const readme = fs.readFileSync(readmePath, 'utf8');

    // active recommendations 指针段在场
    expect(readme).toContain('Active Recommendations');
    // 审查索引段在场
    expect(readme).toContain('审查索引');

    // 最新审查文档(按文件名日期排序的最大者)必须出现在 README 索引中
    const reviewFiles = fs.readdirSync(PROJECT_REVIEW_DOCS_ROOT)
      .filter((name) => name.endsWith('.md') && name !== 'README.md' && /^\d{4}-\d{2}-\d{2}/.test(name))
      .sort();
    const latest = reviewFiles[reviewFiles.length - 1];
    expect(latest).toBeDefined();
    // 索引以链接形式引用最新审查(去掉 .md 后缀的链接 target)
    const latestLinkTarget = `(${latest})`;
    expect(readme).toContain(latestLinkTarget);
  });
});
