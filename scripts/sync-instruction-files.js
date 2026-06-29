#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const CLAUDE_PATH = path.join(REPO_ROOT, 'CLAUDE.md');
const AGENTS_PATH = path.join(REPO_ROOT, 'AGENTS.md');

// 手写治理区与 managed block 区的分界标记。脚本只派生标记之前的手写区,
// managed 区(lang/bootstrap)由 spec-first init 各 host 生成,脚本不触碰。
const LANG_START = '<!-- spec-first:lang:start -->';

// 派生提示注释:HTML 注释内禁止出现 `--`,措辞需规避。
const DERIVED_NOTE =
  '<!-- 本治理区从 CLAUDE.md 自动派生(scripts/sync-instruction-files.js);改 CLAUDE.md 后运行 npm run sync:instructions 校验,加 write 参数重新生成;勿手改本区。-->';

// host 变换规则,全部 required:source 串在 CLAUDE.md 手写区未命中即 fail-loud,
// 防止入口措辞漂移导致派生时静默漏替换。
const HOST_RULES = [
  {
    id: 'title',
    from: '# CLAUDE.md\n',
    to: `# Repository Guidelines\n\n${DERIVED_NOTE}\n`,
  },
  {
    id: 'role-intro',
    from: '本文件为 Claude Code 在本仓库工作时提供项目级执行指引。',
    to: '本文件为 Codex 和其他 AI agent 在本仓库工作时提供项目级执行指引。',
  },
];

function splitHandwritten(content, file) {
  const idx = content.indexOf(LANG_START);
  if (idx === -1) {
    throw new Error(
      `${file} 缺少 managed 标记 ${LANG_START};请先运行 spec-first init 生成 managed block`,
    );
  }
  return {
    handwritten: content.slice(0, idx),
    managed: content.slice(idx),
  };
}

/**
 * 以 CLAUDE.md 手写区为 source 派生 AGENTS.md 期望内容。
 * 手写区按 host 规则变换;managed 区原样保留 AGENTS.md 自身的(各 host 由 init 生成)。
 */
function deriveAgentsContent(claudeContent, agentsContent) {
  const claude = splitHandwritten(claudeContent, 'CLAUDE.md');
  const agents = splitHandwritten(agentsContent, 'AGENTS.md');

  let handwritten = claude.handwritten;
  for (const rule of HOST_RULES) {
    if (!handwritten.includes(rule.from)) {
      throw new Error(
        `派生规则 ${rule.id} 在 CLAUDE.md 手写区未命中 source 串;host 变换可能已漂移,请更新 scripts/sync-instruction-files.js`,
      );
    }
    handwritten = handwritten.replace(rule.from, rule.to);
  }

  return `${handwritten}${agents.managed}`;
}

function firstDiffLine(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const max = Math.max(expectedLines.length, actualLines.length);
  for (let i = 0; i < max; i += 1) {
    if (expectedLines[i] !== actualLines[i]) {
      return {
        line: i + 1,
        expected: expectedLines[i],
        actual: actualLines[i],
      };
    }
  }
  return null;
}

function main() {
  const write = process.argv.slice(2).includes('--write');
  const claudeContent = fs.readFileSync(CLAUDE_PATH, 'utf8');
  const agentsContent = fs.readFileSync(AGENTS_PATH, 'utf8');
  const expected = deriveAgentsContent(claudeContent, agentsContent);

  if (expected === agentsContent) {
    console.log('PASS: AGENTS.md 与 CLAUDE.md 手写治理区一致');
    return;
  }

  if (write) {
    fs.writeFileSync(AGENTS_PATH, expected);
    console.log('WROTE: 已从 CLAUDE.md 派生更新 AGENTS.md 手写治理区');
    return;
  }

  const diff = firstDiffLine(expected, agentsContent);
  console.error('FAIL: AGENTS.md 已偏离 CLAUDE.md 派生结果');
  if (diff) {
    console.error(`  首处差异 第 ${diff.line} 行`);
    console.error(`    期望: ${JSON.stringify(diff.expected)}`);
    console.error(`    实际: ${JSON.stringify(diff.actual)}`);
  }
  console.error('  运行 `npm run sync:instructions -- --write` 重新派生');
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  LANG_START,
  HOST_RULES,
  deriveAgentsContent,
};
