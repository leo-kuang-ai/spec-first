'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const entryPattern = /^- v(?:\d+\.\d+\.\d+|X\.Y\.Z) \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [^:]+: .+$/;
const legacyEntryPattern = /^- v\d+\.\d+\.\d+ \d{4}-\d{2}-\d{2} [^:]+: .+$/;

function changelogEntries(content) {
  return content.split('\n').filter((line) => /^- v(?:\d|X)/.test(line));
}

describe('CHANGELOG format', () => {
  test('repository changelog keeps the documented entry shape', () => {
    const content = fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8');
    expect(content).toContain('- 记录格式：`- v版本号 YYYY-MM-DD HH:MM:SS 作者: 变更摘要 [(user-visible)]`');
    const entries = changelogEntries(content);
    expect(entries.length).toBeGreaterThan(0);
    expect(entryPattern.test(entries[0])).toBe(true);
    expect(entries.filter((line) => !entryPattern.test(line) && !legacyEntryPattern.test(line))).toEqual([]);
  });
});
