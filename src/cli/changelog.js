const fs = require('node:fs');
const path = require('node:path');

/**
 * Bootstrap CHANGELOG.md at projectRoot if it does not already exist.
 *
 * Creates the file with a format header and one initial entry. If the file
 * already exists, this is a no-op — CHANGELOG.md is user-owned once created.
 *
 * @param {string} projectRoot
 * @param {{ name: string, version: string }} developer
 * @returns {boolean} true if the file was created, false if it already existed
 */
function bootstrapChangelog(projectRoot, developer) {
  const filePath = path.join(projectRoot, 'CHANGELOG.md');

  if (fs.existsSync(filePath)) {
    return false;
  }

  const timestamp = formatChangelogTimestamp(new Date());
  const name = developer.name || '';
  const version = developer.version || '';

  const content = buildInitialChangelog(timestamp, name, version);
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Build the initial CHANGELOG.md content.
 * Exported for unit testing.
 *
 * @param {string} timestamp - YYYY-MM-DD HH:MM:SS
 * @param {string} name     - developer name
 * @param {string} version  - spec-first version
 * @returns {string}
 */
function buildInitialChangelog(timestamp, name, version) {
  const resolvedVersion = version ? `v${version}` : 'vX.Y.Z';
  const resolvedName = name || '作者';
  return `# Changelog

- 记录格式：\`- v版本号 YYYY-MM-DD HH:MM:SS 作者: 变更摘要 [(user-visible)]\`
- 说明：
  - \`v版本号\` 使用本次变更对应的发布版本
  - 日期时间必须使用 \`YYYY-MM-DD HH:MM:SS\`
  - \`作者\` 填写提交人或变更责任人
  - \`变更摘要\` 使用中文，简明说明本次改动
  - 用户可感知的变更在末尾追加 \`(user-visible)\`

- ${resolvedVersion} ${timestamp} ${resolvedName}: 使用 spec-first 初始化项目
`;
}

function formatChangelogTimestamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  bootstrapChangelog,
  buildInitialChangelog,
  formatChangelogTimestamp,
};
