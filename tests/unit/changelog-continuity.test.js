'use strict';

const fs = require('node:fs');
const path = require('node:path');

// CHANGELOG 连续性守卫：2026-08 分支上发生过两次静默截短（25d83e43 将 3437 条
// 覆盖为 5 条；ce20cae4 的恢复不完整），全部既有验证链均未拦截。本测试把
// 「条目只增不减」固化为确定性断言：条目数不得低于已恢复的历史下限，且最老
// 条目不得晚于历史起点。新增宿主/特性只会增加条目；若确需收缩历史（不应发生），
// 必须先修改本测试的下限并说明理由。
const CHANGELOG_PATH = path.join(__dirname, '..', '..', 'CHANGELOG.md');
// 恢复基线：v1.15.1 (1c61c410) 快照的 3420 条 + 恢复后新纪元条目；下限取历史快照数。
const HISTORICAL_FLOOR = 3420;
const OLDEST_ALLOWED = '2026-05-15 00:16:00';

function readEntries() {
  const content = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const entries = content.match(/^- v.*$/gm) || [];
  return { content, entries };
}

describe('changelog continuity guard', () => {
  test('keeps the full restored history: entry count never falls below the snapshot floor', () => {
    const { entries } = readEntries();
    expect(entries.length).toBeGreaterThanOrEqual(HISTORICAL_FLOOR);
  });

  test('oldest entry does not regress past the history start point', () => {
    const { entries } = readEntries();
    // 历史语料含「日期无时分秒」变体，最老判定按日期前缀比较。
    const dateOf = (entry) => (entry.match(/^- v[\d.]+ (\d{4}-\d{2}-\d{2})/) || [])[1];
    const dates = entries.map(dateOf).filter(Boolean);
    expect(dates.length).toBe(entries.length);
    expect(dates[dates.length - 1] <= OLDEST_ALLOWED.slice(0, 10)).toBe(true);
  });

  test('every entry follows the repo changelog line format', () => {
    const { entries } = readEntries();
    expect(entries.length).toBeGreaterThan(0);
    const format = /^- v\d+\.\d+\.\d+ \d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})? [^:]+: .+/;
    const bad = entries.filter((entry) => !format.test(entry));
    expect(bad).toEqual([]);
  });
});
