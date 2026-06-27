'use strict';

// P0#1: reason_code prose↔code parity 闸。
// 守护 BLOCKING_REASON_CODES(code 冻结真相)与 prose 复述(SKILL.md Phase 4 列表 +
// prd-readiness-lens.md must-not-ready 列表)的边界。prose 是人/agent 可读副本,
// code 是可执行真相;新增/重命名 blocker 码忘记同步 prose 会让读者以为某码可 ready
// 或困惑为何 ready 失败。此测试锁 missing 方向(code 的每个码都被 prose 列出),
// 这是高危害漂移;extra 方向(prose 多列不存在的码)风险低且段落混有字段名 token 易误报,
// 留人工 review。
//
// 锚点段落:SKILL.md "If the checker/finalize path returns" 句、
// lens.md "The readiness orchestrator must consume declaration findings" 句。
// 段落里反引号 token 含字段名(如 design_sources_unread),故只数 code Set 认识的码。

const fs = require('node:fs');
const path = require('node:path');

// BLOCKING_REASON_CODES 真相源是 scripts/lib/reason-codes.js(check 与 finalize 共同 import);
// parity 闸直接锁真相源,而非经 check 间接 re-export。
const {
  BLOCKING_REASON_CODES,
} = require('../../skills/spec-prd/scripts/lib/reason-codes');

const SKILL_PATH = path.join(__dirname, '../../skills/spec-prd/SKILL.md');
const LENS_PATH = path.join(__dirname, '../../skills/spec-prd/references/prd-readiness-lens.md');

// 从 anchor 句所在段落(向下扫 8 行,覆盖整段 must-not-ready 列表)提取反引号 token,
// 只保留 code Set 认识的 reason_code。
function blockingCodesInProse(text, anchor) {
  const lines = text.split(/\r?\n/);
  const idx = lines.findIndex((l) => l.includes(anchor));
  if (idx === -1) {
    throw new Error(`anchor not found in prose: ${anchor}`);
  }
  const found = new Set();
  for (let i = idx; i < Math.min(idx + 8, lines.length); i += 1) {
    const matches = lines[i].match(/`[a-z0-9_]+`/g) || [];
    matches.forEach((tok) => {
      const code = tok.slice(1, -1);
      if (BLOCKING_REASON_CODES.has(code)) found.add(code);
    });
  }
  return found;
}

describe('spec-prd reason_code prose↔code parity', () => {
  const codeSet = new Set(BLOCKING_REASON_CODES);

  test('SKILL.md Phase 4 must-not-ready 列表覆盖全部 BLOCKING_REASON_CODES', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const proseCodes = blockingCodesInProse(skill, 'If the checker/finalize path returns');
    const missing = [...codeSet].filter((c) => !proseCodes.has(c));
    expect(missing).toEqual([]);
  });

  test('prd-readiness-lens.md must-not-ready 列表覆盖全部 BLOCKING_REASON_CODES', () => {
    const lens = fs.readFileSync(LENS_PATH, 'utf8');
    const proseCodes = blockingCodesInProse(lens, 'The readiness orchestrator must consume declaration findings');
    const missing = [...codeSet].filter((c) => !proseCodes.has(c));
    expect(missing).toEqual([]);
  });
});
