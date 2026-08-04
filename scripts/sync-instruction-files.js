#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  renderGraphifyInstructionSection,
} = require('../skills/spec-runtime-setup/scripts/providers/graphify.cjs');

const REPO_ROOT = path.join(__dirname, '..');
const CLAUDE_PATH = path.join(REPO_ROOT, 'CLAUDE.md');
const AGENTS_PATH = path.join(REPO_ROOT, 'AGENTS.md');

// 手写治理区与 managed block 区的分界标记。脚本派生标记之前的手写区；
// lang/bootstrap 仍由 spec-first init 各 host 生成并原样保留，尾部 Graphify 段
// 则由 Runtime Setup canonical renderer 单独规范化。
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

function normalizeGraphifySection(content, host) {
  const headings = Array.from(content.matchAll(/^## graphify[ \t]*$/gm));
  if (headings.length > 1) {
    throw new Error(`${host} instruction 存在多个 ## graphify 段;拒绝静默选择 source`);
  }
  const section = `${renderGraphifyInstructionSection(host).trimEnd()}\n`;
  if (headings.length === 0) {
    const separator = content.length === 0 || content.endsWith('\n') ? '' : '\n';
    return `${content}${separator}\n${section}`;
  }

  const start = headings[0].index;
  const remainder = content.slice(start + headings[0][0].length);
  const nextSection = remainder.search(/\n## |\n<!-- spec-first:[^>]+:start -->/);
  const end = nextSection === -1 ? content.length : start + headings[0][0].length + nextSection;
  return `${content.slice(0, start)}${section}${content.slice(end).replace(/^\n+/, '\n\n')}`;
}

/**
 * 以 CLAUDE.md 手写区与 Graphify canonical renderer 派生双宿主期望内容。
 * 手写区按 host 规则变换；lang/bootstrap managed 区保留各 host 自身投影。
 */
function deriveInstructionContents(claudeContent, agentsContent) {
  const normalizedClaude = normalizeGraphifySection(claudeContent, 'claude');
  const normalizedAgents = normalizeGraphifySection(agentsContent, 'codex');
  const claude = splitHandwritten(normalizedClaude, 'CLAUDE.md');
  const agents = splitHandwritten(normalizedAgents, 'AGENTS.md');

  let handwritten = claude.handwritten;
  for (const rule of HOST_RULES) {
    if (!handwritten.includes(rule.from)) {
      throw new Error(
        `派生规则 ${rule.id} 在 CLAUDE.md 手写区未命中 source 串;host 变换可能已漂移,请更新 scripts/sync-instruction-files.js`,
      );
    }
    handwritten = handwritten.replace(rule.from, rule.to);
  }

  return {
    claude: normalizedClaude,
    agents: `${handwritten}${agents.managed}`,
  };
}

function deriveAgentsContent(claudeContent, agentsContent) {
  return deriveInstructionContents(claudeContent, agentsContent).agents;
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
  const expected = deriveInstructionContents(claudeContent, agentsContent);

  if (expected.claude === claudeContent && expected.agents === agentsContent) {
    console.log('PASS: 双宿主 instruction 与 canonical source 一致');
    return;
  }

  if (write) {
    if (expected.claude !== claudeContent) fs.writeFileSync(CLAUDE_PATH, expected.claude);
    if (expected.agents !== agentsContent) fs.writeFileSync(AGENTS_PATH, expected.agents);
    console.log('WROTE: 已从 canonical source 重新生成双宿主 instruction');
    return;
  }

  const file = expected.claude !== claudeContent ? 'CLAUDE.md' : 'AGENTS.md';
  const diff = firstDiffLine(
    file === 'CLAUDE.md' ? expected.claude : expected.agents,
    file === 'CLAUDE.md' ? claudeContent : agentsContent,
  );
  console.error(`FAIL: ${file} 已偏离 canonical instruction source`);
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
  normalizeGraphifySection,
  deriveInstructionContents,
  deriveAgentsContent,
};
